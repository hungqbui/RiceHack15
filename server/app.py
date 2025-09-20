from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect
import os
import base64
import logging
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from educational_service import get_educational_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for client-server communication

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Create uploads directory
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Allowed file extensions
ALLOWED_PDF_EXTENSIONS = {'pdf'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}

def allowed_file(filename, allowed_extensions):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'Educational AI Flask App with WebSocket Audio Support!',
        'status': 'healthy',
        'features': ['Direct Audio Processing', 'Text Chat', 'WebSocket Support', 'File Upload']
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    """Simple text chat endpoint with optional file selection"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        file_ids = data.get('file_ids', None)  # Optional file selection
        
        # Validate file_ids if provided
        if file_ids is not None and not isinstance(file_ids, list):
            return jsonify({'error': 'file_ids must be an array'}), 400
        
        result = get_educational_service().educational_chat(message, file_ids)
        
        # Add file selection info to response
        if file_ids:
            result['selected_files'] = file_ids
            result['files_used'] = len(file_ids)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload and process PDF and image files for RAG"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS.union(ALLOWED_IMAGE_EXTENSIONS)):
            return jsonify({'error': 'Invalid file type. Only PDF and image files are allowed.'}), 400
        
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        if file_ext in ALLOWED_PDF_EXTENSIONS:
            # Process PDF
            logger.info(f"Processing PDF: {filename}")
            extraction_result = get_educational_service().extract_text_from_pdf(file, filename)
            
            if extraction_result['status'] == 'success':
                # Add extracted text to RAG system with file metadata
                file_id = extraction_result['metadata']['file_id']
                rag_result = get_educational_service().add_documents_to_rag(
                    [extraction_result['text']], 
                    [filename],
                    [file_id],
                    [extraction_result['metadata']]
                )
                
                return jsonify({
                    'message': 'PDF processed and added to knowledge base successfully',
                    'filename': filename,
                    'file_id': file_id,
                    'type': 'pdf',
                    'extraction_result': {
                        'file_id': file_id,
                        'pages': extraction_result['metadata']['pages'],
                        'method': extraction_result['metadata']['method'],
                        'text_length': len(extraction_result['text']),
                        'upload_timestamp': extraction_result['metadata']['upload_timestamp']
                    },
                    'rag_result': rag_result,
                    'status': 'success'
                })
            else:
                return jsonify({
                    'error': extraction_result.get('message', 'Failed to extract text from PDF'),
                    'filename': filename,
                    'status': 'error'
                }), 400
                
        elif file_ext in ALLOWED_IMAGE_EXTENSIONS:
            # Process Image with OCR
            logger.info(f"Processing image with OCR: {filename}")
            extraction_result = get_educational_service().extract_text_from_image(file, filename)
            
            if extraction_result['status'] in ['success', 'warning']:
                if extraction_result['text']:
                    # Add extracted text to RAG system with file metadata
                    file_id = extraction_result['metadata']['file_id']
                    rag_result = get_educational_service().add_documents_to_rag(
                        [extraction_result['text']], 
                        [f"Image: {filename}"],
                        [file_id],
                        [extraction_result['metadata']]
                    )
                    
                    return jsonify({
                        'message': 'Image processed and text added to knowledge base successfully',
                        'filename': filename,
                        'file_id': file_id,
                        'type': 'image',
                        'extraction_result': {
                            'file_id': file_id,
                            'confidence': extraction_result['metadata'].get('avg_confidence', 0),
                            'text_length': len(extraction_result['text']),
                            'upload_timestamp': extraction_result['metadata']['upload_timestamp']
                        },
                        'rag_result': rag_result,
                        'status': 'success'
                    })
                else:
                    file_id = extraction_result['metadata']['file_id']
                    return jsonify({
                        'message': 'No text found in image',
                        'filename': filename,
                        'file_id': file_id,
                        'type': 'image',
                        'extraction_result': extraction_result,
                        'status': 'warning'
                    })
            else:
                return jsonify({
                    'error': extraction_result.get('message', 'Failed to extract text from image'),
                    'filename': filename,
                    'status': 'error'
                }), 400
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
            
    except Exception as e:
        logger.error(f"Error processing file upload: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/upload/multiple', methods=['POST'])
def upload_multiple_files():
    """Upload and process multiple PDF and image files for RAG"""
    try:
        # Collect all files from different possible form field names
        files = []
        filenames = []
        
        # Check for 'files' field (HTML multiple file input)
        if 'files' in request.files:
            multi_files = request.files.getlist('files')
            for file in multi_files:
                if file.filename != '':
                    files.append(file)
                    filenames.append(file.filename)
        
        # Check for array notation (files[0], files[1], etc.)
        for key in request.files.keys():
            if key.startswith('files[') and key.endswith(']'):
                file = request.files[key]
                if file.filename != '':
                    files.append(file)
                    filenames.append(file.filename)
        
        # Check for individual file fields (file0, file1, etc.)
        i = 0
        while f'file{i}' in request.files:
            file = request.files[f'file{i}']
            if file.filename != '':
                files.append(file)
                filenames.append(file.filename)
            i += 1
        
        if not files:
            return jsonify({'error': 'No files provided or selected'}), 400
        
        # Process all files
        results = []
        total_chunks = 0
        successful_files = 0
        failed_files = []
        
        for i, (file, filename) in enumerate(zip(files, filenames)):
            try:
                # Validate file type
                if not allowed_file(filename, ALLOWED_PDF_EXTENSIONS.union(ALLOWED_IMAGE_EXTENSIONS)):
                    failed_files.append({
                        'filename': filename,
                        'error': 'Invalid file type. Only PDF and image files are allowed.'
                    })
                    continue
                
                secure_name = secure_filename(filename)
                file_ext = secure_name.rsplit('.', 1)[1].lower() if '.' in secure_name else ''
                
                # Process based on file type
                if file_ext in ALLOWED_PDF_EXTENSIONS:
                    extraction_result = get_educational_service().extract_text_from_pdf(file, filename)
                elif file_ext in ALLOWED_IMAGE_EXTENSIONS:
                    extraction_result = get_educational_service().extract_text_from_image(file, filename)
                else:
                    failed_files.append({
                        'filename': filename,
                        'error': 'Unsupported file type'
                    })
                    continue
                
                if extraction_result['status'] == 'success' and extraction_result['text']:
                    # Add to RAG system
                    file_id = extraction_result['metadata']['file_id']
                    rag_result = get_educational_service().add_documents_to_rag(
                        [extraction_result['text']], 
                        [filename],
                        [file_id],
                        [extraction_result['metadata']]
                    )
                    
                    results.append({
                        'filename': filename,
                        'file_id': file_id,
                        'type': file_ext,
                        'chunks_added': rag_result.get('chunks_added', 0),
                        'text_length': len(extraction_result['text']),
                        'status': 'success'
                    })
                    
                    total_chunks += rag_result.get('chunks_added', 0)
                    successful_files += 1
                    
                else:
                    failed_files.append({
                        'filename': filename,
                        'error': extraction_result.get('message', 'Failed to extract text'),
                        'file_id': extraction_result['metadata'].get('file_id') if 'metadata' in extraction_result else None
                    })
                    
            except Exception as e:
                failed_files.append({
                    'filename': filename,
                    'error': f'Processing error: {str(e)}'
                })
        
        # Prepare response
        response_data = {
            'message': f'Processed {successful_files} of {len(files)} files successfully',
            'total_files_uploaded': len(files),
            'successful_files': successful_files,
            'total_chunks_added': total_chunks,
            'successful_results': results,
            'status': 'success' if successful_files > 0 else 'error'
        }
        
        if failed_files:
            response_data['failed_files'] = failed_files
            response_data['failed_count'] = len(failed_files)
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error processing multiple file upload: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all uploaded files with their metadata"""
    try:
        # Get all unique file IDs from the database
        service = get_educational_service()
        collection = service.collection
        
        # Aggregate to get unique files with their metadata
        pipeline = [
            {"$match": {"metadata.file_id": {"$exists": True}}},
            {"$group": {
                "_id": "$metadata.file_id",
                "filename": {"$first": "$metadata.filename"},
                "upload_timestamp": {"$first": "$metadata.upload_timestamp"},
                "file_type": {"$first": "$metadata.file_type"},
                "document_count": {"$sum": 1}
            }},
            {"$sort": {"upload_timestamp": -1}}
        ]
        
        files = list(collection.aggregate(pipeline))
        
        # Format the response
        file_list = []
        for file_doc in files:
            file_list.append({
                'file_id': file_doc['_id'],
                'filename': file_doc.get('filename', 'Unknown'),
                'upload_timestamp': file_doc.get('upload_timestamp'),
                'file_type': file_doc.get('file_type', 'unknown'),
                'document_count': file_doc.get('document_count', 0)
            })
        
        return jsonify({
            'files': file_list,
            'total_files': len(file_list),
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/files/<file_id>', methods=['GET'])
def get_file_info(file_id):
    """Get information about a specific file by its ID"""
    try:
        result = get_educational_service().get_documents_by_file_id(file_id)
        
        if result['status'] == 'success':
            return jsonify({
                'file_id': file_id,
                'documents': result['documents'],
                'count': result['count'],
                'status': 'success'
            })
        else:
            return jsonify({
                'file_id': file_id,
                'error': result.get('message', 'File not found'),
                'status': 'error'
            }), 404
            
    except Exception as e:
        logger.error(f"Error retrieving file info: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/chat/file/<file_id>', methods=['POST'])
def chat_with_file(file_id):
    """Chat with a specific file using its file ID"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        question = data['message']
        max_chunks = data.get('max_chunks', 4)
        
        # Get file-specific context
        context_result = get_educational_service().get_file_specific_context(
            file_id, question, max_chunks
        )
        
        if context_result['status'] != 'success':
            return jsonify({
                'file_id': file_id,
                'answer': context_result.get('message', 'No content found in this file'),
                'sources': [],
                'status': 'warning'
            })
        
        # Generate response using file-specific context
        context = context_result['context']
        
        # Use the educational chat with the specific context
        prompt = f"""You are an educational AI assistant. Use the following context from a specific document to answer the student's question.

Context from file {file_id}:
{context}

Student's question: {question}

Educational response based on this specific document:"""
        
        chat_model = get_educational_service().chat_model
        if chat_model:
            response = chat_model.invoke(prompt)
            answer = response.content if hasattr(response, 'content') else str(response)
        else:
            answer = "Educational AI service is not properly initialized."
        
        return jsonify({
            'file_id': file_id,
            'answer': answer,
            'context_chunks': context_result['chunks_found'],
            'sources': context_result.get('chunks_metadata', []),
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error in file-specific chat: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/files/batch', methods=['POST'])
def get_multiple_files_info():
    """Get information about multiple files by their IDs"""
    try:
        data = request.get_json()
        if not data or 'file_ids' not in data:
            return jsonify({'error': 'file_ids array is required'}), 400
        
        file_ids = data['file_ids']
        if not isinstance(file_ids, list) or not file_ids:
            return jsonify({'error': 'file_ids must be a non-empty array'}), 400
        
        results = {}
        total_documents = 0
        found_files = []
        not_found_files = []
        
        for file_id in file_ids:
            try:
                result = get_educational_service().get_documents_by_file_id(file_id)
                
                if result['status'] == 'success':
                    results[file_id] = {
                        'documents': result['documents'],
                        'count': result['count'],
                        'status': 'success'
                    }
                    total_documents += result['count']
                    found_files.append(file_id)
                else:
                    results[file_id] = {
                        'error': result.get('message', 'File not found'),
                        'status': 'not_found'
                    }
                    not_found_files.append(file_id)
                    
            except Exception as e:
                results[file_id] = {
                    'error': str(e),
                    'status': 'error'
                }
                not_found_files.append(file_id)
        
        return jsonify({
            'file_results': results,
            'summary': {
                'total_requested': len(file_ids),
                'found_files': len(found_files),
                'not_found_files': len(not_found_files),
                'total_documents': total_documents
            },
            'found_file_ids': found_files,
            'not_found_file_ids': not_found_files,
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error retrieving multiple files info: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/chat/files', methods=['POST'])
def chat_with_multiple_files():
    """Chat with multiple files using their file IDs"""
    try:
        data = request.get_json()
        if not data or 'file_ids' not in data or 'message' not in data:
            return jsonify({'error': 'file_ids array and message are required'}), 400
        
        file_ids = data['file_ids']
        question = data['message']
        max_chunks_per_file = data.get('max_chunks_per_file', 2)
        
        if not isinstance(file_ids, list) or not file_ids:
            return jsonify({'error': 'file_ids must be a non-empty array'}), 400
        
        # Get context from all specified files
        all_context = []
        all_sources = []
        total_chunks = 0
        found_files = []
        
        for file_id in file_ids:
            context_result = get_educational_service().get_file_specific_context(
                file_id, question, max_chunks_per_file
            )
            
            if context_result['status'] == 'success':
                all_context.append(f"[From file {file_id}]:\n{context_result['context']}")
                all_sources.extend(context_result.get('chunks_metadata', []))
                total_chunks += context_result['chunks_found']
                found_files.append(file_id)
        
        if not all_context:
            return jsonify({
                'file_ids': file_ids,
                'answer': 'No relevant content found in any of the specified files',
                'sources': [],
                'found_files': [],
                'total_chunks': 0,
                'status': 'warning'
            })
        
        # Combine all context
        combined_context = "\n\n".join(all_context)
        
        # Generate response using combined context
        prompt = f"""You are an educational AI assistant. Use the following context from multiple documents to answer the student's question.

Context from {len(found_files)} files:
{combined_context}

Student's question: {question}

Educational response based on these documents:"""
        
        chat_model = get_educational_service().chat_model
        if chat_model:
            response = chat_model.invoke(prompt)
            answer = response.content if hasattr(response, 'content') else str(response)
        else:
            answer = "Educational AI service is not properly initialized."
        
        return jsonify({
            'file_ids': file_ids,
            'found_files': found_files,
            'answer': answer,
            'total_chunks': total_chunks,
            'sources': all_sources,
            'context_summary': {
                'files_used': len(found_files),
                'total_files_requested': len(file_ids),
                'chunks_per_file': max_chunks_per_file
            },
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error in multi-file chat: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz():
    """Generate a quiz or mock exam based on selected context"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Extract parameters
        file_ids = data.get('file_ids', None)  # Optional file selection
        quiz_prompt = data.get('quiz_prompt', None)  # Optional custom instructions
        quiz_type = data.get('quiz_type', 'mixed')  # multiple_choice, short_answer, essay, mixed
        num_questions = data.get('num_questions', 5)  # Number of questions
        
        # Validate inputs
        if file_ids is not None and not isinstance(file_ids, list):
            return jsonify({'error': 'file_ids must be an array'}), 400
        
        if not isinstance(num_questions, int) or num_questions < 1 or num_questions > 20:
            return jsonify({'error': 'num_questions must be an integer between 1 and 20'}), 400
        
        valid_quiz_types = ['multiple_choice', 'short_answer', 'essay', 'mixed']
        if quiz_type not in valid_quiz_types:
            return jsonify({
                'error': f'quiz_type must be one of: {", ".join(valid_quiz_types)}'
            }), 400
        
        # Generate quiz
        result = get_educational_service().generate_quiz(
            file_ids=file_ids,
            quiz_prompt=quiz_prompt,
            quiz_type=quiz_type,
            num_questions=num_questions
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in quiz generation: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

# WebSocket Events for Direct Audio Processing

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected to WebSocket")
    emit('status', {'message': 'Connected to educational AI server', 'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected from WebSocket")

@socketio.on('audio_message')
def handle_audio_message(data):
    """
    Handle direct audio input for educational chat
    
    Expected data format:
    {
        'audio': 'base64_encoded_audio_data',
        'mime_type': 'audio/wav',  # or audio/mp3, etc.
        'session_id': 'optional_session_id',
        'file_ids': ['file1', 'file2']  # optional selected documents
    }
    """
    try:
        logger.info("Received audio message for direct processing")
        
        # Validate input data
        if not data or 'audio' not in data:
            emit('error', {'message': 'Audio data is required', 'status': 'error'})
            return
        
        audio_base64 = data['audio']
        mime_type = data.get('mime_type', 'audio/wav')
        session_id = data.get('session_id', 'default')
        file_ids = data.get('file_ids', None)  # Optional file selection
        
        # Validate file_ids if provided
        if file_ids is not None and not isinstance(file_ids, list):
            emit('error', {'message': 'file_ids must be an array', 'status': 'error'})
            return
        
        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(audio_base64)
            logger.info(f"Decoded audio data: {len(audio_bytes)} bytes, type: {mime_type}")
            if file_ids:
                logger.info(f"Using selected files: {file_ids}")
        except Exception as e:
            emit('error', {'message': f'Invalid audio data: {str(e)}', 'status': 'error'})
            return
        
        # Emit processing status
        emit('status', {'message': 'Processing audio with Gemini AI...', 'status': 'processing'})
        
        # Process audio directly with Gemini, using selected files if provided
        result = get_educational_service().educational_audio_chat(audio_bytes, mime_type, file_ids)
        
        if result['status'] == 'success':
            logger.info("Audio processed successfully")
            response_data = {
                'answer': result['answer'],
                'sources': result['sources'],
                'session_id': session_id,
                'status': 'success',
                'audio_processed': result.get('audio_processed', False),
                'transcribed_question': result.get('transcribed_question', ''),
                'context_used': result.get('context_used', False),
                'relevant_documents': result.get('relevant_documents', 0)
            }
            
            # Add file selection info if files were selected
            if file_ids:
                response_data['selected_files'] = file_ids
                response_data['files_used'] = len(file_ids)
            
            emit('audio_response', response_data)
        else:
            logger.error(f"Audio processing failed: {result.get('answer', 'Unknown error')}")
            emit('error', {
                'message': result.get('answer', 'Audio processing failed'),
                'status': 'error'
            })
            
    except Exception as e:
        logger.error(f"Error handling audio message: {str(e)}")
        emit('error', {'message': f'Server error: {str(e)}', 'status': 'error'})

@socketio.on('text_message')
def handle_text_message(data):
    """
    Handle text-based educational chat
    
    Expected data format:
    {
        'message': 'text_question',
        'session_id': 'optional_session_id',
        'file_ids': ['file1', 'file2']  # optional selected documents
    }
    """
    try:
        logger.info("Received text message")
        
        # Validate input data
        if not data or 'message' not in data:
            emit('error', {'message': 'Message is required', 'status': 'error'})
            return
        
        question = data['message']
        session_id = data.get('session_id', 'default')
        file_ids = data.get('file_ids', None)  # Optional file selection
        
        # Validate file_ids if provided
        if file_ids is not None and not isinstance(file_ids, list):
            emit('error', {'message': 'file_ids must be an array', 'status': 'error'})
            return
        
        if file_ids:
            logger.info(f"Processing text with selected files: {file_ids}")
        
        # Emit processing status
        emit('status', {'message': 'Processing question...', 'status': 'processing'})
        
        # Process text question with selected files if provided
        result = get_educational_service().educational_chat(question, file_ids)
        
        if result['status'] == 'success':
            logger.info("Text processed successfully")
            response_data = {
                'answer': result['answer'],
                'sources': result['sources'],
                'session_id': session_id,
                'status': 'success'
            }
            
            # Add file selection info if files were selected
            if file_ids:
                response_data['selected_files'] = file_ids
                response_data['files_used'] = len(file_ids)
            
            emit('text_response', response_data)
        else:
            logger.error(f"Text processing failed: {result.get('answer', 'Unknown error')}")
            emit('error', {
                'message': result.get('answer', 'Text processing failed'),
                'status': 'error'
            })
            
    except Exception as e:
        logger.error(f"Error handling text message: {str(e)}")
        emit('error', {'message': f'Server error: {str(e)}', 'status': 'error'})

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    
    logger.info("Starting Educational AI Flask App with WebSocket support")
    logger.info("Features: Direct Audio Processing, Text Chat, WebSocket Communication, File Upload")
    logger.info("AI Model: Google Gemini 2.0 Flash with direct audio input")
    
    # Run with SocketIO
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port)
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect
import os
import base64
import logging
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from simple_educational_service import simple_educational_service

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
        'message': 'Flask app with LangChain is running!',
        'status': 'healthy'
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    """Simple chat endpoint using LangChain"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        result = langchain_service.simple_chat(message)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/conversation', methods=['POST'])
def conversation():
    """Conversation endpoint with memory"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        result = langchain_service.conversation_chat(message)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/summarize', methods=['POST'])
def summarize():
    """Text summarization endpoint"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text']
        result = langchain_service.summarize_text(text)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/documents', methods=['POST'])
def process_documents():
    """Process documents for semantic search"""
    try:
        data = request.get_json()
        if not data or 'documents' not in data:
            return jsonify({'error': 'Documents array is required'}), 400
        
        documents = data['documents']
        if not isinstance(documents, list):
            return jsonify({'error': 'Documents must be an array'}), 400
        
        result = langchain_service.process_documents(documents)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/search', methods=['POST'])
def semantic_search():
    """Semantic search endpoint"""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        query = data['query']
        k = data.get('k', 5)  # Number of results to return
        
        result = langchain_service.semantic_search(query, k)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/clear-memory', methods=['POST'])
def clear_memory():
    """Clear conversation memory"""
    try:
        result = langchain_service.clear_conversation_memory()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Educational AI Endpoints

@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    """Upload and process PDF for educational materials"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400
        
        # Extract text from PDF
        result = educational_service.extract_text_from_pdf(file)
        
        if result['status'] == 'success':
            # Add to RAG system
            filename = secure_filename(file.filename)
            rag_result = educational_service.add_documents_to_rag(
                [result['text']], 
                [filename]
            )
            
            return jsonify({
                'message': 'PDF processed successfully',
                'filename': filename,
                'extraction_result': result,
                'rag_result': rag_result,
                'status': 'success'
            })
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Upload and process image for OCR text extraction"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            return jsonify({'error': 'Invalid file type. Only image files are allowed.'}), 400
        
        # Extract text from image
        result = educational_service.extract_text_from_image(file)
        
        if result['status'] in ['success', 'warning']:
            # Add to RAG system if text was extracted
            if result['text']:
                filename = secure_filename(file.filename)
                rag_result = educational_service.add_documents_to_rag(
                    [result['text']], 
                    [f"Image: {filename}"]
                )
                
                return jsonify({
                    'message': 'Image processed successfully',
                    'filename': filename,
                    'extraction_result': result,
                    'rag_result': rag_result,
                    'status': 'success'
                })
            else:
                return jsonify({
                    'message': 'No text found in image',
                    'extraction_result': result,
                    'status': 'warning'
                })
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/educational-chat', methods=['POST'])
def educational_chat():
    """Educational chat using RAG for context-aware responses"""
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({'error': 'Question is required'}), 400
        
        question = data['question']
        result = educational_service.educational_chat(question)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/knowledge-base/stats', methods=['GET'])
def get_knowledge_base_stats():
    """Get statistics about the current knowledge base"""
    try:
        result = educational_service.get_knowledge_base_stats()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/knowledge-base/clear', methods=['POST'])
def clear_knowledge_base():
    """Clear the knowledge base"""
    try:
        result = educational_service.clear_knowledge_base()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/add-text', methods=['POST'])
def add_text_to_knowledge_base():
    """Manually add text to the knowledge base"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text']
        source_name = data.get('source', 'Manual Input')
        
        result = educational_service.add_documents_to_rag([text], [source_name])
        
        return jsonify(result)
        
    except Exception as e:
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
        'session_id': 'optional_session_id'
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
        
        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(audio_base64)
            logger.info(f"Decoded audio data: {len(audio_bytes)} bytes, type: {mime_type}")
        except Exception as e:
            emit('error', {'message': f'Invalid audio data: {str(e)}', 'status': 'error'})
            return
        
        # Emit processing status
        emit('status', {'message': 'Processing audio with Gemini AI...', 'status': 'processing'})
        
        # Process audio directly with Gemini
        result = educational_service.educational_audio_chat(audio_bytes, mime_type)
        
        if result['status'] == 'success':
            logger.info("Audio processed successfully")
            emit('audio_response', {
                'answer': result['answer'],
                'sources': result['sources'],
                'session_id': session_id,
                'status': 'success',
                'audio_processed': result.get('audio_processed', False)
            })
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
        'session_id': 'optional_session_id'
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
        
        # Emit processing status
        emit('status', {'message': 'Processing question...', 'status': 'processing'})
        
        # Process text question
        result = educational_service.educational_chat(question)
        
        if result['status'] == 'success':
            logger.info("Text processed successfully")
            emit('text_response', {
                'answer': result['answer'],
                'sources': result['sources'],
                'session_id': session_id,
                'status': 'success'
            })
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
    logger.info("Features: Direct Audio Processing, Text Chat, File Upload")
    logger.info("AI Model: Google Gemini Pro with direct audio input")
    
    # Run with SocketIO
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port)
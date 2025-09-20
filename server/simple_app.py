from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect
import os
import base64
import logging
from dotenv import load_dotenv
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

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'Educational AI Flask App with WebSocket Audio Support!',
        'status': 'healthy',
        'features': ['Direct Audio Processing', 'Text Chat', 'WebSocket Support']
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    """Simple text chat endpoint"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        result = simple_educational_service.educational_chat(message)
        
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
        result = simple_educational_service.educational_audio_chat(audio_bytes, mime_type)
        
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
        result = simple_educational_service.educational_chat(question)
        
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
    logger.info("Features: Direct Audio Processing, Text Chat, WebSocket Communication")
    logger.info("AI Model: Google Gemini 2.0 Flash with direct audio input")
    
    # Run with SocketIO
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port)
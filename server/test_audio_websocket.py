#!/usr/bin/env python3
"""
Test script for WebSocket audio functionality
"""

import os
import base64
import socketio
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_audio():
    """Create a simple test audio file for testing"""
    # This is a very basic WAV header for a 1-second silence
    # In practice, you'd use real audio data
    wav_header = b'RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xAC\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x08\x00\x00'
    # Add some basic audio data (silence)
    audio_data = wav_header + b'\x00' * 8000  # 1 second of silence at 8kHz
    return audio_data

def test_websocket_audio():
    """Test WebSocket audio communication"""
    
    # Create a Socket.IO client
    sio = socketio.Client()
    
    # Event handlers
    @sio.event
    def connect():
        logger.info("Connected to server")
    
    @sio.event
    def disconnect():
        logger.info("Disconnected from server")
    
    @sio.event
    def status(data):
        logger.info(f"Status: {data}")
    
    @sio.event
    def audio_response(data):
        logger.info(f"Audio Response: {data}")
        print(f"AI Response: {data.get('answer', 'No answer')}")
        sio.disconnect()
    
    @sio.event
    def error(data):
        logger.error(f"Error: {data}")
        sio.disconnect()
    
    try:
        # Connect to the server
        server_url = os.getenv('SERVER_URL', 'http://localhost:5000')
        logger.info(f"Connecting to {server_url}")
        sio.connect(server_url)
        
        # Wait for connection
        time.sleep(1)
        
        # Create test audio data
        audio_data = create_test_audio()
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Send audio message
        logger.info("Sending test audio message")
        sio.emit('audio_message', {
            'audio': audio_base64,
            'mime_type': 'audio/wav',
            'session_id': 'test_session'
        })
        
        # Wait for response
        sio.wait()
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
    
    finally:
        if sio.connected:
            sio.disconnect()

def test_websocket_text():
    """Test WebSocket text communication"""
    
    # Create a Socket.IO client
    sio = socketio.Client()
    
    # Event handlers
    @sio.event
    def connect():
        logger.info("Connected to server")
    
    @sio.event
    def disconnect():
        logger.info("Disconnected from server")
    
    @sio.event
    def status(data):
        logger.info(f"Status: {data}")
    
    @sio.event
    def text_response(data):
        logger.info(f"Text Response: {data}")
        print(f"AI Response: {data.get('answer', 'No answer')}")
        sio.disconnect()
    
    @sio.event
    def error(data):
        logger.error(f"Error: {data}")
        sio.disconnect()
    
    try:
        # Connect to the server
        server_url = os.getenv('SERVER_URL', 'http://localhost:5000')
        logger.info(f"Connecting to {server_url}")
        sio.connect(server_url)
        
        # Wait for connection
        time.sleep(1)
        
        # Send text message
        logger.info("Sending test text message")
        sio.emit('text_message', {
            'message': 'Hello, can you explain what photosynthesis is?',
            'session_id': 'test_session'
        })
        
        # Wait for response
        sio.wait()
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
    
    finally:
        if sio.connected:
            sio.disconnect()

if __name__ == "__main__":
    print("=== WebSocket Audio Test ===")
    
    # Check if server is running
    server_url = os.getenv('SERVER_URL', 'http://localhost:5000')
    print(f"Testing server at: {server_url}")
    print("Make sure the Flask app is running with: python app.py")
    print()
    
    # Test text communication first
    print("1. Testing text communication...")
    test_websocket_text()
    
    time.sleep(2)
    
    # Test audio communication
    print("\n2. Testing audio communication...")
    test_websocket_audio()
    
    print("\nTest completed!")
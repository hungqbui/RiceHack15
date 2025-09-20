#!/usr/bin/env python3
"""
Direct test of audio functionality without running the server
"""

import os
import base64
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from simple_educational_service import simple_educational_service

def create_test_audio():
    """Create a simple test audio file"""
    # Simple WAV header for testing (1 second of silence)
    wav_header = b'RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xAC\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x08\x00\x00'
    audio_data = wav_header + b'\x00' * 8000
    return audio_data

def test_text_functionality():
    """Test basic text functionality"""
    print("=== Testing Text Functionality ===")
    
    result = simple_educational_service.educational_chat("What is photosynthesis?")
    
    print(f"Status: {result['status']}")
    print(f"Answer: {result['answer'][:200]}...")
    print(f"Sources: {len(result['sources'])} sources")
    
    return result['status'] == 'success'

def test_audio_functionality():
    """Test direct audio functionality"""
    print("\n=== Testing Audio Functionality ===")
    
    # Create test audio
    audio_data = create_test_audio()
    print(f"Created test audio: {len(audio_data)} bytes")
    
    # Test audio processing
    result = simple_educational_service.educational_audio_chat(audio_data, 'audio/wav')
    
    print(f"Status: {result['status']}")
    print(f"Answer: {result['answer'][:200]}...")
    print(f"Sources: {len(result['sources'])} sources")
    print(f"Audio Processed: {result.get('audio_processed', False)}")
    
    return result['status'] == 'success'

def test_base64_audio():
    """Test base64 encoded audio (as used in WebSocket)"""
    print("\n=== Testing Base64 Audio Processing ===")
    
    # Create test audio and encode to base64
    audio_data = create_test_audio()
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    
    print(f"Base64 audio length: {len(audio_base64)} characters")
    
    # Decode and process
    decoded_audio = base64.b64decode(audio_base64)
    result = simple_educational_service.educational_audio_chat(decoded_audio, 'audio/wav')
    
    print(f"Status: {result['status']}")
    print(f"Answer preview: {result['answer'][:100]}...")
    
    return result['status'] == 'success'

def main():
    """Run all functionality tests"""
    print("=== Direct Audio-to-LLM Functionality Test ===")
    print("Testing direct audio input to Google Gemini")
    print()
    
    # Check if API key is available
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("⚠ Warning: GOOGLE_API_KEY not set. Some tests may fail.")
        print("Please set your Google API key in the .env file.")
        print()
    else:
        print("✓ Google API key is configured")
        print()
    
    success_count = 0
    total_tests = 3
    
    # Test text functionality
    if test_text_functionality():
        print("✓ Text functionality works")
        success_count += 1
    else:
        print("✗ Text functionality failed")
    
    # Test audio functionality
    if test_audio_functionality():
        print("✓ Audio functionality works")
        success_count += 1
    else:
        print("✗ Audio functionality failed")
    
    # Test base64 audio (WebSocket format)
    if test_base64_audio():
        print("✓ Base64 audio processing works")
        success_count += 1
    else:
        print("✗ Base64 audio processing failed")
    
    print(f"\n=== Test Results ===")
    print(f"Passed: {success_count}/{total_tests} tests")
    
    if success_count == total_tests:
        print("🎉 All tests passed! Direct audio-to-LLM functionality is working.")
        print("\nNext steps:")
        print("1. Run the Flask app: python simple_app.py")
        print("2. Connect with WebSocket client")
        print("3. Send audio data in base64 format")
        print("4. Receive direct AI responses from Gemini")
    else:
        print("⚠ Some tests failed. Check your Google API key and internet connection.")
    
    return success_count == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Mock client for testing real-time audio input to the educational AI server
"""

import socketio
import pyaudio
import wave
import base64
import threading
import time
import io
import sys

class AudioClient:
    def __init__(self, server_url='http://localhost:5000'):
        self.server_url = server_url
        self.sio = socketio.Client()
        self.recording = False
        self.audio_frames = []
        
        # Audio configuration
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = 44100
        self.chunk = 1024
        self.audio_instance = None
        
        # Setup socket event handlers
        self.setup_socket_handlers()
    
    def setup_socket_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        def connect():
            print("🔗 Connected to educational AI server")
            print("🎤 Ready for audio input!")
        
        @self.sio.event
        def disconnect():
            print("❌ Disconnected from server")
        
        @self.sio.on('status')
        def on_status(data):
            print(f"📊 Status: {data.get('message', 'Processing...')}")
        
        @self.sio.on('audio_response')
        def on_audio_response(data):
            print(f"\n🤖 AI Response:")
            print(f"   Answer: {data.get('answer', 'No response')}")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Audio Processed: {data.get('audio_processed', False)}")
            if data.get('sources'):
                print(f"   Sources: {len(data['sources'])} documents referenced")
            print()
        
        @self.sio.on('error')
        def on_error(data):
            print(f"❌ Error: {data.get('message', 'Unknown error')}")
    
    def connect_to_server(self):
        """Connect to the WebSocket server"""
        try:
            print(f"🔄 Connecting to {self.server_url}...")
            self.sio.connect(self.server_url)
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {str(e)}")
            return False
    
    def init_audio(self):
        """Initialize PyAudio"""
        try:
            self.audio_instance = pyaudio.PyAudio()
            return True
        except Exception as e:
            print(f"❌ Failed to initialize audio: {str(e)}")
            return False
    
    def start_recording(self, duration=5):
        """Start recording audio from microphone"""
        if not self.audio_instance:
            print("❌ Audio not initialized")
            return None
        
        print(f"🎤 Recording for {duration} seconds... Speak now!")
        
        stream = self.audio_instance.open(
            format=self.format,
            channels=self.channels,
            rate=self.rate,
            input=True,
            frames_per_buffer=self.chunk
        )
        
        frames = []
        for _ in range(0, int(self.rate / self.chunk * duration)):
            data = stream.read(self.chunk)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        print("🔇 Recording finished!")
        return frames
    
    def frames_to_wav_bytes(self, frames):
        """Convert audio frames to WAV bytes"""
        wav_buffer = io.BytesIO()
        
        with wave.open(wav_buffer, 'wb') as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.audio_instance.get_sample_size(self.format))
            wf.setframerate(self.rate)
            wf.writeframes(b''.join(frames))
        
        wav_buffer.seek(0)
        return wav_buffer.read()
    
    def send_audio(self, audio_frames):
        """Send recorded audio to server"""
        try:
            # Convert frames to WAV bytes
            wav_bytes = self.frames_to_wav_bytes(audio_frames)
            
            # Encode to base64
            audio_base64 = base64.b64encode(wav_bytes).decode('utf-8')
            
            print(f"📤 Sending audio ({len(wav_bytes)} bytes) to server...")
            
            # Send via WebSocket
            self.sio.emit('audio_message', {
                'audio': audio_base64,
                'mime_type': 'audio/wav',
                'session_id': 'test_session'
            })
            
        except Exception as e:
            print(f"❌ Failed to send audio: {str(e)}")
    
    def test_realtime_audio(self):
        """Test real-time audio capture and processing"""
        print("🎯 Starting Real-time Audio Test")
        print("=" * 50)
        
        if not self.connect_to_server():
            return
        
        if not self.init_audio():
            return
        
        try:
            while True:
                print("\n🎮 Controls:")
                print("  [1] Record and send audio (5 seconds)")
                print("  [2] Record and send audio (10 seconds)")
                print("  [3] Send test text message")
                print("  [q] Quit")
                
                choice = input("\nEnter choice: ").strip().lower()
                
                if choice == 'q':
                    break
                elif choice == '1':
                    frames = self.start_recording(5)
                    if frames:
                        self.send_audio(frames)
                elif choice == '2':
                    frames = self.start_recording(10)
                    if frames:
                        self.send_audio(frames)
                elif choice == '3':
                    self.send_test_text()
                else:
                    print("❌ Invalid choice")
                
                # Wait a bit for response
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 Interrupted by user")
        finally:
            self.cleanup()
    
    def send_test_text(self):
        """Send a test text message"""
        test_message = "Hello AI, can you explain machine learning?"
        print(f"📤 Sending test text: '{test_message}'")
        
        self.sio.emit('text_message', {
            'message': test_message,
            'session_id': 'test_session'
        })
    
    def cleanup(self):
        """Clean up resources"""
        print("🧹 Cleaning up...")
        
        if self.audio_instance:
            self.audio_instance.terminate()
        
        if self.sio.connected:
            self.sio.disconnect()
        
        print("✅ Cleanup complete")

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import pyaudio
        return True
    except ImportError:
        print("❌ PyAudio not found. Install it with:")
        print("   pip install pyaudio")
        print("\n💡 Alternative: Use the simulated audio test instead")
        return False

def main():
    print("🎙️ Educational AI Real-time Audio Client")
    print("=" * 50)
    
    if not check_dependencies():
        print("\n🔄 Falling back to simulated audio test...")
        from test_simulated_audio import test_simulated_audio
        test_simulated_audio()
        return
    
    client = AudioClient()
    
    try:
        client.test_realtime_audio()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        client.cleanup()

if __name__ == "__main__":
    main()
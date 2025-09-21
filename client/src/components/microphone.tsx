import React, { useState, useRef, useCallback } from 'react';

interface MicrophoneProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export const Microphone = ({ onAudioRecorded, disabled = false }: MicrophoneProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (disabled || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        onAudioRecorded(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 2000);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [disabled, isRecording, onAudioRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startRecording();
  }, [startRecording]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    stopRecording();
  }, [stopRecording]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg 
        viewBox="0 0 100 100" 
        className={`mic ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''} ${disabled ? 'disabled' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ userSelect: 'none' }}
      >
        <rect 
          x="25" 
          y="10" 
          width="50" 
          height="65" 
          rx="25" 
          fill={isRecording ? "#ef4444" : isProcessing ? "#f59e0b" : "#CFD8DC"} 
          stroke={isRecording ? "#dc2626" : isProcessing ? "#d97706" : "#546E7A"} 
          strokeWidth="3" 
        />
        <line x1="50" y1="75" x2="50" y2="90" stroke="#546E7A" strokeWidth="3" />
        <line x1="30" y1="90" x2="70" y2="90" stroke="#546E7A" strokeWidth="4" />
        
        {isRecording && (
          <>
            <circle cx="50" cy="42" r="35" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" className="sound-wave wave-1" />
            <circle cx="50" cy="42" r="45" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.4" className="sound-wave wave-2" />
            <circle cx="50" cy="42" r="55" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.2" className="sound-wave wave-3" />
          </>
        )}
        
        {isProcessing && (
          <circle cx="50" cy="42" r="8" fill="#f59e0b" className="processing-dot" />
        )}
      </svg>
      
      <div style={{ minHeight: '20px', textAlign: 'center' }}>
        {isRecording && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>Recording...</span>}
        {isProcessing && <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '500' }}>Processing...</span>}
        {!isRecording && !isProcessing && (
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Hold to speak</span>
        )}
      </div>
    </div>
  );
};


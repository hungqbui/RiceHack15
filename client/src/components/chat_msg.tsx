import { AudioPlayer } from './audioPlayer';

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioTranscription?: string;
  speechAudio?: string;
  speechMimeType?: string;
}

interface ChatMessageProps {
  conversationHistory?: ConversationMessage[];
  isProcessing?: boolean;
}

export const ChatMessage = ({ conversationHistory = [], isProcessing = false }: ChatMessageProps) => {
  if (conversationHistory.length === 0 && !isProcessing) {
    return (
      <div className="chat-message">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px 12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <span>🎓</span>
          <span>Hold the microphone to start learning!</span>
        </div>
        <div className="chat-bubble-arrow"></div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      maxHeight: '300px',
      overflowY: 'auto',
      padding: '8px'
    }}>
      {conversationHistory.map((message) => (
        <div 
          key={message.id} 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            gap: '4px'
          }}
        >
          <div 
            style={{
              background: message.type === 'user' ? '#3b82f6' : '#e5e7eb',
              color: message.type === 'user' ? 'white' : '#374151',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: '1.4'
            }}
          >
            {message.type === 'user' && (
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                🎙️ You said:
              </div>
            )}
            
            {message.type === 'ai' && (
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                🦉 Owl AI:
              </div>
            )}
            
            {/* For AI messages with speech, show only audio player - no text */}
            {message.type === 'ai' && message.speechAudio ? (
              <div style={{ marginTop: '4px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#4f46e5', 
                  fontStyle: 'italic',
                  marginBottom: '8px' 
                }}>
                  🔊 Listen to AI response...
                </div>
                <AudioPlayer 
                  audioData={message.speechAudio}
                  mimeType={message.speechMimeType}
                  autoPlay={true}
                />
              </div>
            ) : message.type === 'ai' && !message.content ? (
              /* Don't show empty AI messages */
              <div style={{ 
                fontSize: '12px', 
                color: '#9ca3af', 
                fontStyle: 'italic' 
              }}>
                🎧 Audio response only - check the board for visual content
              </div>
            ) : message.content ? (
              /* For user messages or AI messages with text content, show text */
              <div>{message.content}</div>
            ) : null}
          </div>
          
          <div style={{ 
            fontSize: '10px', 
            color: '#6b7280',
            alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start'
          }}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      ))}
      
      {isProcessing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <div style={{
            display: 'flex',
            gap: '2px'
          }}>
            <div style={{ 
              width: '4px', 
              height: '4px', 
              borderRadius: '50%', 
              background: '#92400e',
              animation: 'typing 1.4s infinite ease-in-out'
            }}></div>
            <div style={{ 
              width: '4px', 
              height: '4px', 
              borderRadius: '50%', 
              background: '#92400e',
              animation: 'typing 1.4s infinite ease-in-out 0.2s'
            }}></div>
            <div style={{ 
              width: '4px', 
              height: '4px', 
              borderRadius: '50%', 
              background: '#92400e',
              animation: 'typing 1.4s infinite ease-in-out 0.4s'
            }}></div>
          </div>
          <span>AI is analyzing your question...</span>
        </div>
      )}
    </div>
  );
};


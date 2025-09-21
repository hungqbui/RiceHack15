import { useState, useEffect } from 'react';
import AudioChatService, { type AudioChatResponse } from '../services/audioChatService';
import { useChosenDocuments } from '../contexts/ChosenDocumentsContext';

// Import the new CSS file
import './convo.css';

// Import all the components
import { OwlTeacher } from '../components/owl_figure';
import { Chalkboard } from '../components/whiteboard';
import { ChatMessage } from '../components/chat_msg';    
import { Microphone } from '../components/microphone';

// Main component that assembles the UI
export default function Convo() {
  const [persistedQuestion, setPersistedQuestion] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    audioTranscription?: string;
    speechAudio?: string;
    speechMimeType?: string;
  }>>([]);
  const [currentBoardContent, setCurrentBoardContent] = useState<string>('');
  const [userProgress, setUserProgress] = useState<number>(0);
  const [understandingLevel, setUnderstandingLevel] = useState<string>('beginner');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioChatService] = useState(() => new AudioChatService());
  const { getChosenDocumentsArray } = useChosenDocuments();

  // Check for persisted question on component mount
  useEffect(() => {
    const savedQuestion = sessionStorage.getItem('conversationQuestion');
    if (savedQuestion) {
      try {
        const questionData = JSON.parse(savedQuestion);
        setPersistedQuestion(questionData);
      } catch (error) {
        console.error('Error parsing persisted question:', error);
      }
    }
    
    // Test LaTeX rendering
    setCurrentBoardContent('$E = mc^2$');
  }, []);

  const handleQuestionClick = () => {
    if (persistedQuestion) {
      console.log('Discussing question:', persistedQuestion.question);
      
      // Add the persisted question to the conversation history
      const questionMessage = {
        id: `persisted-${Date.now()}`,
        type: 'user' as const,
        content: `Let's discuss this question: ${persistedQuestion.question}`,
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, questionMessage]);
      
      // Optionally, you could trigger an AI response here
      // or wait for the user to speak about it
    }
  };

  const clearPersistedQuestion = () => {
    setPersistedQuestion(null);
    sessionStorage.removeItem('conversationQuestion');
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    if (isProcessingAudio) return;
    
    setIsProcessingAudio(true);
    
    try {
      const response: AudioChatResponse = await audioChatService.sendDirectAudioChat(
        audioBlob, 
        getChosenDocumentsArray(),
        persistedQuestion
      );
      
      handleAudioChatResponse(response);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleAudioChatResponse = (response: AudioChatResponse) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: response.user_transcription,
      timestamp: new Date(),
      audioTranscription: response.user_transcription
    };
    
    // For AI messages, never show text content when we have audio - only show speech
    const aiMessage = {
      id: `ai-${Date.now()}`,
      type: 'ai' as const,
      content: response.speech_audio ? "" : response.tutoring_response, // Empty if speech available
      timestamp: new Date(),
      speechAudio: response.speech_audio,
      speechMimeType: response.speech_mime_type
    };
    
    setConversationHistory(prev => [...prev, userMessage, aiMessage]);
    
    // Always update board content when received (this will render LaTeX)
    if (response.board_writing) {
      console.log('Setting board content:', response.board_writing);
      setCurrentBoardContent(response.board_writing);
    } else {
      console.log('No board_writing in response:', response);
    }
    
    setUserProgress(response.progress_score);
    setUnderstandingLevel(response.understanding_level);
  };

  return (
    <div className="container">
      <h1 className='title'>Quick lesson with Owlai!</h1>
      
      {/* Display persisted question if it exists */}
      {persistedQuestion && (
        <div className="persisted-question-panel">
          <div className="question-header">
            <span className="question-icon">💡</span>
            <span className="question-title">Continuing Previous Question</span>
            <button 
              className="clear-question-btn"
              onClick={clearPersistedQuestion}
              title="Clear this question"
            >
              ✕
            </button>
          </div>
          <div className="question-content">
            <p><strong>Question:</strong> {persistedQuestion.question}</p>
            {persistedQuestion.subject && (
              <p><strong>Subject:</strong> {persistedQuestion.subject}</p>
            )}
            {persistedQuestion.difficulty && (
              <p><strong>Difficulty:</strong> {persistedQuestion.difficulty}</p>
            )}
          </div>
          <button 
            className="discuss-question-btn"
            onClick={handleQuestionClick}
          >
            Discuss This Question
          </button>
        </div>
      )}
      
      <div className="canvas">
        
        <OwlTeacher />
        
        <Chalkboard boardContent={currentBoardContent} />

        {/* Container for the microphone and chat message */}
        <div className="chat-container">
            <ChatMessage 
              conversationHistory={conversationHistory}
              isProcessing={isProcessingAudio}
            />
            <Microphone 
              onAudioRecorded={handleAudioRecorded}
              disabled={isProcessingAudio}
            />
        </div>

        {/* Progress indicator */}
        {userProgress > 0 && (
          <div className="progress-panel">
            <div className="progress-header">
              <span className="progress-icon">📈</span>
              <span className="progress-title">Learning Progress</span>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${userProgress}%`,
                    background: userProgress >= 80 ? '#10b981' : userProgress >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
              <span className="progress-percentage">{userProgress}%</span>
            </div>
            
            <div className="understanding-level">
              <span className="level-label">Understanding:</span>
              <span className={`level-badge level-${understandingLevel}`}>
                {understandingLevel.charAt(0).toUpperCase() + understandingLevel.slice(1)}
              </span>
            </div>
            
            {userProgress >= 90 && (
              <div className="mastery-message">
                🎉 Excellent! You've mastered this concept!
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';

// Import the new CSS file
import '../components/convo.css';

// Import all the components
import { OwlTeacher } from '../components/owl_figure';
import { Chalkboard } from '../components/whiteboard';
import { ChatMessage } from '../components/chat_msg';    
import { Microphone } from '../components/microphone';

// Main component that assembles the UI
export default function Convo() {
  const [persistedQuestion, setPersistedQuestion] = useState<any>(null);
  
  // Check for persisted question on component mount
  useEffect(() => {
    const savedQuestion = sessionStorage.getItem('conversationQuestion');
    if (savedQuestion) {
      try {
        const questionData = JSON.parse(savedQuestion);
        setPersistedQuestion(questionData);
        // Clear the sessionStorage after loading to prevent it from showing again
        // sessionStorage.removeItem('conversationQuestion');
      } catch (error) {
        console.error('Error parsing persisted question:', error);
      }
    }
  }, []);

  const handleMicClick = () => {
    console.log('Microphone clicked!');
    // Logic to handle voice input would go here
  };

  const handleQuestionClick = () => {
    if (persistedQuestion) {
      // Here you could integrate with your chat system to automatically ask about this question
      console.log('Discussing question:', persistedQuestion.question);
      // You could also clear the question after discussing it
      // clearPersistedQuestion();
    }
  };

  const clearPersistedQuestion = () => {
    setPersistedQuestion(null);
    sessionStorage.removeItem('conversationQuestion');
  };

  return (
    <div className="container">
      <h1 className="title">Quick lesson with Oulai!</h1>
      
      {/* Display persisted question if available */}
      {persistedQuestion && (
        <div style={{
          margin: '20px auto',
          maxWidth: '800px',
          padding: '15px',
          backgroundColor: '#f0f8ff',
          border: '2px solid #4a90e2',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c5aa0', fontSize: '16px' }}>
                📝 Question from Quiz Editor:
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
                {persistedQuestion.question}
              </p>
              
              {persistedQuestion.type === 'multiple_choice' && persistedQuestion.options && (
                <div style={{ margin: '10px 0' }}>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>Options:</p>
                  {persistedQuestion.options.map((option: string, index: number) => (
                    <div key={index} style={{ fontSize: '12px', color: '#555', marginLeft: '10px' }}>
                      {String.fromCharCode(65 + index)}) {option}
                      {index === persistedQuestion.correctAnswer && <span style={{ color: '#28a745', fontWeight: 'bold' }}> ✓</span>}
                    </div>
                  ))}
                </div>
              )}
              
              {persistedQuestion.type === 'blank_filling' && persistedQuestion.answer && (
                <div style={{ margin: '10px 0' }}>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    Answer: <span style={{ color: '#28a745', fontWeight: 'bold' }}>{persistedQuestion.answer}</span>
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ marginLeft: '15px' }}>
              <button
                onClick={handleQuestionClick}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginRight: '5px'
                }}
              >
                💬 Discuss
              </button>
              <button
                onClick={clearPersistedQuestion}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="canvas">
        
        <OwlTeacher />
        
        <Chalkboard />

        {/* Container for the microphone and chat message */}
        <div className="chat-container">
            <ChatMessage />
            <Microphone onClick={handleMicClick} />
        </div>

      </div>
    </div>
  );
}


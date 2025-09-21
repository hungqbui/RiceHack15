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
      <h1 className='title'>Quick lesson with Owlai!</h1>
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


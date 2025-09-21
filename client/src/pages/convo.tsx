import React from 'react';

// Import the new CSS file
import '../components/convo.css';

// Import all the components
import { OwlTeacher } from '../components/owl_figure';
import { Chalkboard } from '../components/whiteboard';
import { ChatMessage } from '../components/chat_msg';    
import { Microphone } from '../components/microphone';

// Main component that assembles the UI
export default function Convo() {
  
  const handleMicClick = () => {
    console.log('Microphone clicked!');
    // Logic to handle voice input would go here
  };

  return (
    <div className="container">
      <h1 className="title">Quick lesson with Oulai!</h1>
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


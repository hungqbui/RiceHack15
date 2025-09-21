import React from 'react';

interface MicrophoneProps {
  onClick: () => void;
}

export const Microphone = ({ onClick }: MicrophoneProps) => (
  <svg 
    viewBox="0 0 100 100" 
    className="mic"
    onClick={onClick}
  >
    <rect x="25" y="10" width="50" height="65" rx="25" fill="#CFD8DC" stroke="#546E7A" strokeWidth="3" />
    <line x1="50" y1="75" x2="50" y2="90" stroke="#546E7A" strokeWidth="3" />
    <line x1="30" y1="90" x2="70" y2="90" stroke="#546E7A" strokeWidth="4" />
  </svg>
);


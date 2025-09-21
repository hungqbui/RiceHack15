import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Define types for better type safety
interface QuizSettings {
  selectedType: string;
  showAnswer: boolean;
  setTimer: boolean;
}

interface QuizContextType {
  quizData: any;
  setQuizData: (data: any) => void;
  settings: QuizSettings;
  setSettings: (settings: QuizSettings) => void;
  numQuestions: number;
  setNumQuestions: (num: number) => void;
  onSettingsChange: (newSettings: Partial<QuizSettings>) => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

const QuizContextProvider = ({ children }: { children: ReactNode }) => {
  const [quizData, setQuizData] = useState<any>(null);
  const [settings, setSettings] = useState<QuizSettings>({
    selectedType: 'multiple-choice',
    showAnswer: false,
    setTimer: false
  });
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // Function to handle settings changes
  const onSettingsChange = (newSettings: Partial<QuizSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const contextValue: QuizContextType = {
    quizData,
    setQuizData,
    settings,
    setSettings,
    numQuestions,
    setNumQuestions,
    onSettingsChange
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === null) {
    throw new Error('useQuiz must be used within a QuizContextProvider');
  }
  return context;
};

export { QuizContextProvider, useQuiz };
export type { QuizSettings, QuizContextType };
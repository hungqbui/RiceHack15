import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Question, QuizSettings } from '../components/quizTypes';

interface QuizContextType {
  quizData: any;
  setQuizData: (data: any) => void;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  selectedQuestion: Question | null;
  setSelectedQuestion: (question: Question | null) => void;
  settings: QuizSettings;
  setSettings: (settings: QuizSettings) => void;
  numQuestions: number;
  setNumQuestions: (num: number) => void;
  onSettingsChange: (newSettings: Partial<QuizSettings>) => void;
  onQuestionUpdate: (updatedQuestion: Question) => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

const QuizContextProvider = ({ children }: { children: ReactNode }) => {
  const [quizData, setQuizData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [settings, setSettings] = useState<QuizSettings>({
    selectedType: 'multiple_choice',
    showAnswer: false,
    setTimer: false,
    timerDuration: 30
  });
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // Function to handle settings changes
  const onSettingsChange = (newSettings: Partial<QuizSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Function to handle question updates
  const onQuestionUpdate = (updatedQuestion: Question) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
    
    // Update selected question if it's the same one being edited
    if (selectedQuestion && selectedQuestion.id === updatedQuestion.id) {
      setSelectedQuestion(updatedQuestion);
    }
  };

  // Update numQuestions when questions array changes
  useEffect(() => {
    setNumQuestions(questions.length);
  }, [questions]);

  const contextValue: QuizContextType = {
    quizData,
    setQuizData,
    questions,
    setQuestions,
    selectedQuestion,
    setSelectedQuestion,
    settings,
    setSettings,
    numQuestions,
    setNumQuestions,
    onSettingsChange,
    onQuestionUpdate
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
export type { QuizContextType };
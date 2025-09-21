import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const QuizContext = createContext<any>(null);

const QuizContextProvider = ({ children }: { children: ReactNode }) => {
    const [quizData, setQuizData] = useState<any>(null);
    
    return (
        <QuizContext.Provider value={{ quizData, setQuizData }}>
            {children}
        </QuizContext.Provider>
    );
}

const useQuiz = () => {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error('useQuiz must be used within a QuizContextProvider');
    }
    return context;
}

export { QuizContextProvider, useQuiz };
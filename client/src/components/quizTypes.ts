export interface Question {
    id: number;
    text: string;
    type: 'multiple_choice' | 'blank_filling';
    options?: string[];
    answer?: string;
    correctAnswer?: string | number; // For tracking correct answers
  }
  
  export interface QuizSettings {
    showAnswer: boolean;
    setTimer: boolean;
    timerDuration?: number; // in minutes
    selectedType: 'multiple_choice' | 'blank_filling';
  }
  
  export interface QuizState {
    questions: Question[];
    selectedQuestion: Question;
    settings: QuizSettings;
    numQuestions: number;
  }
  
  export interface QuizResult {
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    answers: Array<{
      questionId: number;
      userAnswer: string | number;
      isCorrect: boolean;
    }>;
  }
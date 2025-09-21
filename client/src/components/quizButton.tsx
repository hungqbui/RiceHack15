import React from 'react';
import { useQuiz } from '../contexts/QuizContext';
import type { QuizResult } from '../components/quizTypes';

interface QuizActionsProps {
  onHints?: () => void;
  onFinish?: (result: QuizResult) => void;
  isLoading?: boolean;
  showHints?: boolean;
  currentQuestionIndex?: number;
  userAnswers?: Array<{
    questionId: number;
    userAnswer: string | number;
    isCorrect: boolean;
  }>;
  startTime?: Date;
}

const QuizActions: React.FC<QuizActionsProps> = ({
  onHints: propOnHints,
  onFinish: propOnFinish,
  isLoading = false,
  showHints = true,
  currentQuestionIndex = 0,
  userAnswers = [],
  startTime = new Date(),
}) => {
  const { questions, settings } = useQuiz();

  // Default hints handler
  const handleHints = () => {
    if (propOnHints) {
      propOnHints();
    } else {
      // Default behavior: show alert with hints
      alert('Hints: Read the question carefully and consider all options before answering.');
    }
  };

  // Default finish handler
  const handleFinish = () => {
    if (propOnFinish) {
      // Calculate quiz results
      const endTime = new Date();
      const timeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // in seconds
      
      const result: QuizResult = {
        totalQuestions: questions.length,
        correctAnswers: userAnswers.filter(answer => answer.isCorrect).length,
        timeSpent,
        answers: userAnswers,
      };
      
      propOnFinish(result);
    } else {
      // Default behavior: show completion message
      const correctCount = userAnswers.filter(answer => answer.isCorrect).length;
      const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      
      alert(`Quiz completed!\nScore: ${correctCount}/${questions.length} (${percentage}%)`);
    }
  };

  // Check if quiz can be finished (all questions answered or at least some progress)
  const canFinish = userAnswers.length > 0 || currentQuestionIndex > 0;

  return (
    <div className="quiz-actions flex gap-4 justify-center mt-6 p-4">
      {showHints && (
        <button
          onClick={handleHints}
          disabled={isLoading}
          className="hints-btn px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          💡 Hints?
        </button>
      )}
      
      <button
        onClick={handleFinish}
        disabled={isLoading || !canFinish}
        className="finish-btn px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Finishing...
          </span>
        ) : (
          '✅ Finish Quiz'
        )}
      </button>
      
      {/* Show progress indicator */}
      {questions.length > 0 && (
        <div className="flex items-center text-sm text-gray-600 ml-4">
          <span>Progress: {Math.min(currentQuestionIndex + 1, questions.length)}/{questions.length}</span>
          {settings.setTimer && settings.timerDuration && (
            <span className="ml-4">⏱️ Timer: {settings.timerDuration}min</span>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizActions;
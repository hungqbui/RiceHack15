import React, { useState, useEffect } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import QuizActions from './quizButton';
import type { Question, QuizResult } from '../components/quizTypes';
import "./quizUser.css"

interface QuizPlayerProps {
  onQuizComplete?: (result: QuizResult) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ onQuizComplete }) => {
  const { questions, settings } = useQuiz();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Array<{
    questionId: number;
    userAnswer: string | number;
    isCorrect: boolean;
  }>>([]);
  const [showHints, setShowHints] = useState(false);
  const [startTime] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Debug: Log current question to see its structure
  useEffect(() => {
    if (currentQuestion) {
      console.log('Current question:', currentQuestion);
      console.log('Question type:', currentQuestion.type);
      console.log('Question options:', currentQuestion.options);
    }
  }, [currentQuestion]);

  // Timer setup
  useEffect(() => {
    if (settings.setTimer && settings.timerDuration) {
      setTimeLeft(settings.timerDuration * 60); // Convert minutes to seconds
    }
  }, [settings.setTimer, settings.timerDuration]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Time's up - finish quiz automatically
      handleFinishQuiz();
    }
  }, [timeLeft]);

  // Handle answer selection
  const handleAnswerSelect = (answer: string | number) => {
    if (!currentQuestion) return;

    // Check if answer is correct
    let isCorrect = false;
    if (currentQuestion.type === 'multiple_choice') {
      isCorrect = answer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'blank_filling') {
      isCorrect = answer.toString().toLowerCase().trim() === 
                  currentQuestion.answer?.toLowerCase().trim();
    }

    // Update user answers
    const newAnswer = {
      questionId: currentQuestion.id,
      userAnswer: answer,
      isCorrect,
    };

    setUserAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === currentQuestion.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHints(false);
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowHints(false);
    }
  };

  // Handle hints
  const handleShowHints = () => {
    setShowHints(!showHints);
  };

  // Handle quiz completion
  const handleFinishQuiz = async () => {
    setIsLoading(true);
    
    try {
      const endTime = new Date();
      const timeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      
      const result: QuizResult = {
        totalQuestions: questions.length,
        correctAnswers: userAnswers.filter(answer => answer.isCorrect).length,
        timeSpent,
        answers: userAnswers,
      };

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onQuizComplete) {
        onQuizComplete(result);
      } else {
        // Default completion handling
        alert(`Quiz Completed!\n\nScore: ${result.correctAnswers}/${result.totalQuestions}\nTime: ${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`);
      }
    } catch (error) {
      console.error('Error finishing quiz:', error);
      alert('There was an error finishing the quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current user answer for this question
  const getCurrentAnswer = () => {
    return userAnswers.find(a => a.questionId === currentQuestion?.id)?.userAnswer;
  };

  if (questions.length === 0) {
    return (
      <div className="quiz-player p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-600 mb-4">No questions available</h2>
        <p className="text-gray-500">Please add some questions to start the quiz.</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="quiz-player p-8 text-center">Loading question...</div>;
  }

  return (
    <div className="quiz-player max-w-4xl mx-auto p-6">
      {/* Header with timer and progress */}
      <div className="quiz-header mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quiz in Progress</h1>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={`timer text-lg font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            )}
            <div className="progress text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="question-container mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {currentQuestion.text || 'Question text not available'}
        </h2>

        {/* Multiple Choice Options */}
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
          <div className="options space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  getCurrentAnswer() === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={getCurrentAnswer() === index}
                  onChange={() => handleAnswerSelect(index)}
                  className="mr-3"
                />

                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Fill in the Blank */}
        {currentQuestion.type === 'blank_filling' && (
          <div className="answer-input">
            <input
              type="text"
              value={getCurrentAnswer()?.toString() || ''}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              placeholder="Enter your answer here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Hints */}
        {showHints && (
          <div className="hints mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              💡 <strong>Hint:</strong> Read the question carefully and consider all the options before making your choice.
              {currentQuestion.type === 'blank_filling' && 
                ' Think about the most appropriate and complete answer.'}
            </p>
          </div>
        )}

        {/* Show answer if enabled */}
        {settings.showAnswer && (
          <div className="answer-preview mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅ <strong>Correct Answer:</strong> {' '}
              {currentQuestion.type === 'multiple_choice' 
                ? (currentQuestion.correctAnswer !== undefined 
                    ? `${String.fromCharCode(65 + Number(currentQuestion.correctAnswer))}) ${currentQuestion.options?.[Number(currentQuestion.correctAnswer)] || ''}` 
                    : 'Not set')
                : currentQuestion.answer || 'Not set'
              }
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="navigation-container mb-6">
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          
          <span className="text-gray-600">
            {userAnswers.filter(a => questions.some(q => q.id === a.questionId)).length} of {questions.length} answered
          </span>
          
          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Quiz Actions */}
      <QuizActions
        onHints={handleShowHints}
        onFinish={handleFinishQuiz}
        isLoading={isLoading}
        showHints={true}
        currentQuestionIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        startTime={startTime}
      />
    </div>
  );
};

export default QuizPlayer;
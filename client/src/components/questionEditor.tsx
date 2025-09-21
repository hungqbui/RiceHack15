import React from 'react';
import type { Question } from '../components/quizTypes';
import { useQuiz } from '../contexts/QuizContext';

interface QuestionEditorProps {
  question: Question;
  // onQuestionUpdate is now optional since we can get it from context
  onQuestionUpdate?: (updatedQuestion: Question) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onQuestionUpdate: propOnQuestionUpdate,
}) => {
  // Get the context function if no prop is provided
  const { onQuestionUpdate: contextOnQuestionUpdate, settings } = useQuiz();
  
  // Use prop function if provided, otherwise use context function
  const handleQuestionUpdate = propOnQuestionUpdate || contextOnQuestionUpdate;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQuestionUpdate({ ...question, text: e.target.value });
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = e.target.value;
    handleQuestionUpdate({ ...question, options: newOptions });
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQuestionUpdate({ ...question, answer: e.target.value });
  };

  const handleCorrectAnswerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const correctAnswerIndex = parseInt(e.target.value);
    handleQuestionUpdate({ ...question, correctAnswer: correctAnswerIndex });
  };

  // Add new option for multiple choice questions
  const addOption = () => {
    if (question.options && question.options.length < 6) { // Limit to 6 options
      const newOptions = [...question.options, ''];
      handleQuestionUpdate({ ...question, options: newOptions });
    }
  };

  // Remove option for multiple choice questions
  const removeOption = (index: number) => {
    if (question.options && question.options.length > 2) { // Keep at least 2 options
      const newOptions = question.options.filter((_, i) => i !== index);
      handleQuestionUpdate({ ...question, options: newOptions });
    }
  };

  // Helper function to get the answer preview
  const getAnswerPreview = () => {
    if (question.type === 'multiple-choice') {
      if (question.correctAnswer !== undefined) {
        // Convert to number if it's a string
        const answerIndex = typeof question.correctAnswer === 'string' 
          ? parseInt(question.correctAnswer) 
          : question.correctAnswer;
        
        // Check if it's a valid number
        if (!isNaN(answerIndex) && answerIndex >= 0) {
          const optionText = question.options?.[answerIndex] || '';
          return `${String.fromCharCode(65 + answerIndex)}) ${optionText}`;
        }
      }
      return 'Not set';
    } else {
      return question.answer || 'Not set';
    }
  };

  return (
    <div className="mb-6 p-4 border border-gray-300 rounded-md">
      <div className="flex items-center mb-2 space-x-2">
        <span className="font-bold text-lg text-gray-800">Question {question.id}:</span>
        <input
          type="text"
          value={question.text}
          onChange={handleTextChange}
          placeholder="Type your question here..."
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      {question.type === 'multiple-choice' && (
        <div>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700 w-6">
                  {String.fromCharCode(65 + optionIndex)})
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(e, optionIndex)}
                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                {question.options && question.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(optionIndex)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {question.options && question.options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Add Option
            </button>
          )}

          {/* Correct Answer Selection for Multiple Choice */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Answer:
            </label>
            <select
              value={question.correctAnswer || ''}
              onChange={handleCorrectAnswerChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Select correct answer</option>
              {question.options?.map((option, index) => (
                <option key={index} value={index}>
                  {String.fromCharCode(65 + index)}) {option || `Option ${String.fromCharCode(65 + index)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {question.type === 'blank-filling' && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct Answer:
          </label>
          <input
            type="text"
            value={question.answer || ''}
            onChange={handleAnswerChange}
            placeholder="Enter the correct answer here..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
      )}

      {/* Show answer preview if settings allow */}
      {settings.showAnswer && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <span className="text-sm font-medium text-green-800">
            Answer Preview: {getAnswerPreview()}
          </span>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
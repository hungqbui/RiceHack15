import React from 'react';


const QuestionsList = ({ questions, selectedQuestion, onQuestionSelect, onAddQuestion }: any) => {
  return (
    <div className="questions-list">
      <h2>List of questions:</h2>
      <div className="questions-container">
        {questions.map((question:any) => (
          <div
            key={question.id}
            onClick={() => onQuestionSelect(question)}
            className={`question-item ${selectedQuestion.id === question.id ? 'selected' : ''}`}
          >
            <div className="question-title">Question {question.id}</div>
            {question.text && (
              <div className="question-preview">{question.text}</div>
            )}
          </div>
        ))}
      </div>
      <div className="add-question-container">
        <button onClick={onAddQuestion} className="add-question-btn">
          Add Question
        </button>
      </div>
    </div>
  );
};

export default QuestionsList;
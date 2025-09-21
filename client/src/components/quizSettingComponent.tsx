// components/quiz/QuizSettings.js
import React from 'react';
// import './QuizSettings.css';

const QuizSettings = ({ settings, numQuestions, onSettingsChange }: any) => {
  const handleTypeChange = (event:any) => {
    onSettingsChange({ selectedType: event.target.value });
  };

  const handleShowAnswerChange = (event:any) => {
    onSettingsChange({ showAnswer: event.target.checked });
  };

  const handleTimerChange = (event:any) => {
    onSettingsChange({ setTimer: event.target.checked });
  };

  return (
    <div className="quiz-settings">
      <div className="settings-row">
        <div className="setting-group">
          <label className="setting-label">Questions:</label>
          <select
            value={settings.selectedType}
            onChange={handleTypeChange}
            className="setting-select"
          >
            <option value="multiple-choice">Multiple Choice</option>
            <option value="blank-filling">Blank Filling</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label className="setting-label"># of questions</label>
          <input
            type="text"
            value={numQuestions}
            readOnly
            className="question-count-input"
          />
        </div>
        
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              id="show-answer"
              type="checkbox"
              checked={settings.showAnswer}
              onChange={handleShowAnswerChange}
              className="checkbox-input"
            />
            <label htmlFor="show-answer" className="checkbox-label">
              Show answer
            </label>
          </div>
          
          <div className="checkbox-item">
            <input
              id="set-timer"
              type="checkbox"
              checked={settings.setTimer}
              onChange={handleTimerChange}
              className="checkbox-input"
            />
            <label htmlFor="set-timer" className="checkbox-label">
              Set timer
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSettings;
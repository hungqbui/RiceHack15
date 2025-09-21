import React from 'react';
import { useQuiz } from '../contexts/QuizContext';

const QuizSettings = () => {
  // Get all the needed values from the context
  const { settings, numQuestions, onSettingsChange, questions, setQuestions } = useQuiz();

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as 'multiple-choice' | 'blank-filling';
    onSettingsChange({ selectedType: newType });
    
    // Update existing questions to match the new type
    const updatedQuestions = questions.map(question => ({
      ...question,
      type: newType,
      // Reset options and answers when switching types
      options: newType === 'multiple-choice' ? ['', '', '', ''] : undefined,
      answer: newType === 'blank-filling' ? '' : undefined,
    }));
    setQuestions(updatedQuestions);
  };

  const handleShowAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ showAnswer: event.target.checked });
  };

  const handleTimerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ setTimer: event.target.checked });
  };

  const handleTimerDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(event.target.value) || 30;
    onSettingsChange({ timerDuration: duration });
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
          
          {settings.setTimer && (
            <div className="timer-duration">
              <label className="setting-label">Timer (minutes):</label>
              <input
                type="number"
                value={settings.timerDuration || 30}
                onChange={handleTimerDurationChange}
                min="1"
                max="180"
                className="timer-input"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizSettings;
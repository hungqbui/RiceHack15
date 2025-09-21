import React from 'react';
import { useQuiz } from '../contexts/QuizContext';

const QuizSettings = () => {
  // Get all the needed values from the context
  const { settings, numQuestions, onSettingsChange, questions, setQuestions, setNumQuestions } = useQuiz();

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as 'multiple_choice' | 'blank_filling';
    onSettingsChange({ selectedType: newType });
    
    // Update existing questions to match the new type
    const updatedQuestions = questions.map(question => ({
      ...question,
      type: newType,
      // Reset options and answers when switching types
      options: newType === 'multiple_choice' ? ['', '', '', ''] : undefined,
      answer: newType === 'blank_filling' ? '' : undefined,
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
            <option value="multiple_choice">Multiple Choice</option>
            <option value="blank_filling">Blank Filling</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label className="setting-label"># of questions</label>
          <input
            type="text"
            value={numQuestions}
            className="question-count-input"
            onChange={(e) => { setNumQuestions(parseInt(e.target.value) || 0); }}  
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
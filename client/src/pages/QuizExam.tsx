import React, { useState } from 'react';
import { QuizContextProvider, useQuiz } from '../contexts/QuizContext';
import QuizSettings from '../components/quizSettingComponent';
import QuestionEditor from '../components/questionEditor';
import QuizPlayer from '../components/quizUser';
import QuizActions from '../components/quizButton';
import type { Question, QuizResult } from '../components/quizTypes';
import '../components/quiz.css';

type AppMode = 'editor' | 'player' | 'results';

const QuizApp: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('editor');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setMode('results');
  };

  const handleStartQuiz = () => {
    setMode('player');
    setQuizResult(null);
  };

  const handleBackToEditor = () => {
    setMode('editor');
    setQuizResult(null);
  };

  const handleRestartQuiz = () => {
    setMode('player');
    setQuizResult(null);
  };

  return (
    <QuizContextProvider>
      <div className="quiz-app">
        <nav className="quiz-nav">
          <div className="nav-container">
            <div className="nav-content">
              <h1 className="nav-title">Quiz Application</h1>
              <div className="nav-buttons">
                <button
                  onClick={() => setMode('editor')}
                  className={`nav-button ${mode === 'editor' ? 'nav-button-active' : ''}`}
                >
                  📝 Editor
                </button>
                <button
                  onClick={() => setMode('player')}
                  className={`nav-button ${mode === 'player' ? 'nav-button-active' : ''}`}
                >
                  🎯 Quiz
                </button>
                {quizResult && (
                  <button
                    onClick={() => setMode('results')}
                    className={`nav-button ${mode === 'results' ? 'nav-button-active' : ''}`}
                  >
                    📊 Results
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="main-content">
          {mode === 'editor' && <QuizEditorView onStartQuiz={handleStartQuiz} />}
          {mode === 'player' && (
            <QuizPlayer onQuizComplete={handleQuizComplete} />
          )}
          {mode === 'results' && quizResult && (
            <QuizResultsView 
              result={quizResult} 
              onBackToEditor={handleBackToEditor}
              onRestartQuiz={handleRestartQuiz}
            />
          )}
        </main>
      </div>
    </QuizContextProvider>
  );
};

const QuizEditorView: React.FC<{ onStartQuiz: () => void }> = ({ onStartQuiz }) => {
  return <QuizEditorContent onStartQuiz={onStartQuiz} />;
};

const QuizEditorContent: React.FC<{ onStartQuiz: () => void }> = ({ onStartQuiz }) => {
  const { questions, setQuestions, selectedQuestion, setSelectedQuestion, settings } = useQuiz();

  const createSampleQuestions = () => {
    const sampleQuestions: Question[] = [
      {
        id: 1,
        text: 'What is the capital of France?',
        type: 'multiple-choice',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
      },
      {
        id: 2,
        text: 'The largest planet in our solar system is ______.',
        type: 'blank-filling',
        answer: 'Jupiter',
      },
      {
        id: 3,
        text: 'Which of these is a programming language?',
        type: 'multiple-choice',
        options: ['HTML', 'CSS', 'JavaScript', 'All of the above'],
        correctAnswer: 2,
      },
    ];
    setQuestions(sampleQuestions);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      text: '',
      type: settings.selectedType,
      options: settings.selectedType === 'multiple-choice' ? ['', '', '', ''] : undefined,
      answer: settings.selectedType === 'blank-filling' ? '' : undefined,
      correctAnswer: undefined,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion);
  };

  const canStartQuiz = questions.length > 0 && questions.some(q => q.text.trim() !== '');

  return (
    <div className="editor-layout">
      {/* Settings Section */}
      <div className="settings-section">
        <h2 className="section-title">Quiz Settings</h2>
        <QuizSettings />
      </div>

      {/* Questions Management */}
      <div className="questions-section">
        <div className="questions-header">
          <h2 className="section-title">Questions ({questions.length})</h2>
          <div className="action-buttons">
            {questions.length === 0 && (
              <button onClick={createSampleQuestions} className="btn btn-purple">
                📝 Create Sample Questions
              </button>
            )}
            <button onClick={addQuestion} className="btn btn-green">
              ➕ Add Question
            </button>
            {canStartQuiz && (
              <button onClick={onStartQuiz} className="btn btn-blue btn-primary">
                🎯 Start Quiz
              </button>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3 className="empty-title">No questions yet</h3>
            <p className="empty-text">Add questions to create your quiz</p>
          </div>
        ) : (
          <div className="editor-grid">
            {/* Question List */}
            <div className="question-list-section">
              <h3 className="subsection-title">Question List</h3>
              <div className="question-list">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className={`question-item ${
                      selectedQuestion?.id === question.id ? 'question-item-selected' : ''
                    }`}
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="question-content">
                      <h4 className="question-number">Q{question.id}</h4>
                      <p className="question-preview">
                        {question.text || 'Untitled question'}
                      </p>
                      <div className="question-meta">
                        <span className="question-type">
                          {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Fill in Blank'}
                        </span>
                        {((question.type === 'multiple-choice' && question.correctAnswer !== undefined) ||
                          (question.type === 'blank-filling' && question.answer)) && (
                          <span className="question-complete">✓ Complete</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Editor */}
            <div className="editor-section">
              <h3 className="subsection-title">
                {selectedQuestion ? `Edit Question ${selectedQuestion.id}` : 'Select a question to edit'}
              </h3>
              {selectedQuestion ? (
                <QuestionEditor question={selectedQuestion} />
              ) : (
                <div className="editor-placeholder">
                  <div className="placeholder-icon">👈</div>
                  <p className="placeholder-text">Select a question from the list to start editing</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuizResultsView: React.FC<{
  result: QuizResult;
  onBackToEditor: () => void;
  onRestartQuiz: () => void;
}> = ({ result, onBackToEditor, onRestartQuiz }) => {
  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  const timeFormatted = `${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`;

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A', className: 'grade-a', message: 'Excellent!' };
    if (percentage >= 80) return { grade: 'B', className: 'grade-b', message: 'Good job!' };
    if (percentage >= 70) return { grade: 'C', className: 'grade-c', message: 'Not bad!' };
    if (percentage >= 60) return { grade: 'D', className: 'grade-d', message: 'Needs improvement' };
    return { grade: 'F', className: 'grade-f', message: 'Keep practicing!' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="results-container">
      <div className="results-card">
        <div className="results-header">
          <h1 className="results-title">Quiz Complete! 🎉</h1>
          <div className={`grade-display ${gradeInfo.className}`}>
            {gradeInfo.grade}
          </div>
          <p className="results-message">{gradeInfo.message}</p>
          <p className="results-score">
            {result.correctAnswers} out of {result.totalQuestions} correct ({percentage}%)
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-correct">
            <div className="stat-number">{result.correctAnswers}</div>
            <div className="stat-label">Correct Answers</div>
          </div>
          <div className="stat-card stat-incorrect">
            <div className="stat-number">{result.totalQuestions - result.correctAnswers}</div>
            <div className="stat-label">Incorrect Answers</div>
          </div>
          <div className="stat-card stat-time">
            <div className="stat-number">{timeFormatted}</div>
            <div className="stat-label">Time Taken</div>
          </div>
        </div>

        <div className="results-actions">
          <button onClick={onRestartQuiz} className="btn btn-blue">
            🔄 Retake Quiz
          </button>
          <button onClick={onBackToEditor} className="btn btn-gray">
            📝 Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizApp;
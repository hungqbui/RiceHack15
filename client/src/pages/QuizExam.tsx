import React, { useState } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { useChosenDocuments } from '../contexts/ChosenDocumentsContext';
import QuizSettings from '../components/quizSettingComponent';
import QuestionEditor from '../components/questionEditor';
import QuizPlayer from '../components/quizUser';
import { generateQuizFromAPI } from '../utils/quizGenerator';
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
  );
};

const QuizEditorView: React.FC<{ onStartQuiz: () => void }> = ({ onStartQuiz }) => {
  return <QuizEditorContent onStartQuiz={onStartQuiz} />;
};

const QuizEditorContent: React.FC<{ onStartQuiz: () => void }> = ({ onStartQuiz }) => {
  const { questions, setQuestions, selectedQuestion, setSelectedQuestion, settings, numQuestions } = useQuiz();
  const { getChosenDocumentsArray } = useChosenDocuments();
  const [isGenerating, setIsGenerating] = useState(false);

  // Debug: Log chosen documents on component mount and whenever they change
  React.useEffect(() => {
    const chosenDocs = getChosenDocumentsArray();
    console.log('QuizExam - Chosen documents on mount/update:', chosenDocs);
  }, [getChosenDocumentsArray]);

  const createSampleQuestions = async () => {
    try {
      setIsGenerating(true);
      const chosenDocumentIds = getChosenDocumentsArray();
      console.log(chosenDocumentIds)
      // Determine the number of questions to generate (minimum 3, maximum 10)
      const questionsToGenerate = Math.max(3, Math.min(numQuestions || 5, 10));
      
      // Generate quiz using the new utility
      const result = await generateQuizFromAPI({
        fileIds: chosenDocumentIds,
        quizType: settings.selectedType === 'multiple_choice' ? 'multiple_choice' : 'blank_filling',
        numQuestions: questionsToGenerate
      });
      
      if (result.status === 'success' && result.quiz && result.quiz.questions) {
        // Convert API response to our Question format
        const generatedQuestions: Question[] = result.quiz.questions.map((q: any, index: number) => {
          if (settings.selectedType === 'multiple_choice') {
            // Map correct answer to index: A=0, B=1, C=2, D=3
            let correctAnswerIndex = 0;
            if (typeof q.correct_answer === 'string') {
              // If correct_answer is a letter (A, B, C, D), convert to index
              const letterMatch = q.correct_answer.match(/^[A-D]/i);
              if (letterMatch) {
                correctAnswerIndex = letterMatch[0].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
              } else if (q.options && q.options.includes(q.correct_answer)) {
                // If correct_answer is the actual text, find its index in options
                correctAnswerIndex = q.options.indexOf(q.correct_answer);
              }
            } else if (typeof q.correct_answer === 'number') {
              // If it's already a number, use it directly (assuming 0-based indexing)
              correctAnswerIndex = q.correct_answer;
            }
            
            return {
              id: index + 1,
              text: q.question || q.text || '',
              type: 'multiple_choice' as const,
              options: q.options || ['', '', '', ''],
              correctAnswer: correctAnswerIndex,
            };
          } else {
            return {
              id: index + 1,
              text: q.question || q.text || '',
              type: 'blank_filling' as const,
              answer: q.correct_answer || q.answer || '',
            };
          }
        });
        console.log(generatedQuestions, result);
        setQuestions(generatedQuestions);
        
        // Automatically select the first question for editing
        if (generatedQuestions.length > 0) {
          setSelectedQuestion(generatedQuestions[0]);
        }
      } else if (result.quiz && result.quiz.raw_response) {
        // Handle case where API returned raw response due to parsing issues
        console.warn('API returned raw response, using fallback questions');
        createFallbackQuestions();
        alert('Generated quiz content needs manual review. Using sample questions for now.');
      } else {
        // Fallback to default questions if API fails
        console.warn('API returned unexpected format, using fallback questions');
        createFallbackQuestions();
      }
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      // Fallback to default questions if API fails
      createFallbackQuestions();
      alert('Failed to generate questions from documents. Using sample questions instead.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createFallbackQuestions = () => {
    const sampleQuestions: Question[] = [
      {
        id: 1,
        text: 'What is the capital of France?',
        type: 'multiple_choice',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
      },
      {
        id: 2,
        text: 'The largest planet in our solar system is ______.', 
        type: 'blank_filling',
        answer: 'Jupiter',
      },
      {
        id: 3,
        text: 'Which of these is a programming language?',
        type: 'multiple_choice',
        options: ['HTML', 'CSS', 'JavaScript', 'All of the above'],
        correctAnswer: 2,
      },
    ];
    setQuestions(sampleQuestions);
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
              <button 
                onClick={createSampleQuestions} 
                className="btn btn-purple"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>� Generating Questions...</>
                ) : (
                  <>�📝 Create Sample Questions</>
                )}
              </button>
            )}

            {canStartQuiz && (
              <button onClick={onStartQuiz} className="btn btn-blue btn-primary">
                🎯 Start Quiz
              </button>
            )}
          </div>
        </div>

        {/* Show chosen documents info */}
        {questions.length === 0 && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: 'rgba(102, 126, 234, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#4a5568' }}>
              📚 Document Context:
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {getChosenDocumentsArray().length > 0 
                ? `${getChosenDocumentsArray().length} document(s) selected. Questions will be generated based on your chosen materials.`
                : 'No documents selected. Questions will be generated from general knowledge or you can select documents from the sidebar first.'
              }
            </p>
            {/* Debug info */}
            <details style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              <summary style={{ cursor: 'pointer' }}>Debug: Show selected document IDs</summary>
              <pre style={{ background: '#f5f5f5', padding: '8px', marginTop: '5px', borderRadius: '4px', overflow: 'auto' }}>
                {JSON.stringify(getChosenDocumentsArray(), null, 2)}
              </pre>
            </details>
          </div>
        )}

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
                          {question.type === 'multiple_choice' ? 'Multiple Choice' : 'Fill in Blank'}
                        </span>
                        {((question.type === 'multiple_choice' && question.correctAnswer !== undefined) ||
                          (question.type === 'blank_filling' && question.answer)) && (
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
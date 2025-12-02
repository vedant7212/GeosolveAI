import React, { useState, useEffect } from 'react';
import '../styles/Quiz.css';

function Quiz({ userEmail }) {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const startQuiz = async (quizId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (response.ok) {
        const data = await response.json();
        setQuizDetails(data);
        setSelectedQuiz(quizId);
        setResponses({});
        setSubmitted(false);
      }
    } catch (err) {
      console.error('Error fetching quiz details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setResponses({...responses, [questionId]: answer});
  };

  const submitQuiz = async () => {
    if (!userEmail) {
      console.error('User email is not available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: selectedQuiz,
          user_email: userEmail,
          responses: responses
        })
      });

      const data = await response.json();

      if (response.ok) {
        setScore(data.score);
        setSubmitted(true);
      } else {
        console.error('Server error:', data.error);
        alert(`Error: ${data.error || 'Failed to submit quiz'}`);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert(`Error submitting quiz: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && score !== null && quizDetails) {
    return (
      <div className="quiz-results">
        <div className="results-card">
          <h2>🎉 Quiz Completed!</h2>
          <div className="score-display">
            <div className="score-value">{score}/{quizDetails.questions ? quizDetails.questions.length : 0}</div>
            <div className="score-percentage">{quizDetails.questions ? Math.round((score / quizDetails.questions.length) * 100) : 0}%</div>
          </div>
          <button className="btn-quiz" onClick={() => { setSelectedQuiz(null); setQuizDetails(null); fetchQuizzes(); }}>
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (quizDetails && selectedQuiz) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>{quizDetails.title}</h2>
          <button className="btn-back" onClick={() => setSelectedQuiz(null)}>← Back</button>
        </div>
        
        <div className="quiz-progress">
          Progress: {Object.keys(responses).length} / {quizDetails.questions.length}
        </div>

        <div className="questions-container">
          {quizDetails.questions.map((q, idx) => (
            <div key={q.id} className="question-card">
              <div className="question-number">Question {idx + 1}</div>
              <h3>{q.text}</h3>
              
              <div className="options">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <label key={opt} className="option">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={opt}
                      checked={responses[q.id] === opt}
                      onChange={() => handleAnswer(q.id, opt)}
                    />
                    <span className="option-label">
                      {opt.toUpperCase()}: {q.options[opt]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn-submit-quiz"
          onClick={submitQuiz}
          disabled={Object.keys(responses).length !== quizDetails.questions.length || loading}
        >
          {loading ? '⏳ Submitting...' : '✅ Submit Quiz'}
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-list">
      <h2>📚 Available Quizzes</h2>
      {quizzes.length === 0 ? (
        <div className="empty-state">No quizzes available yet</div>
      ) : (
        <div className="quizzes-grid">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <h3>{quiz.title}</h3>
              <p>{quiz.description || 'No description'}</p>
              <button
                className="btn-quiz"
                onClick={() => startQuiz(quiz.id)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Start Quiz →'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Quiz;

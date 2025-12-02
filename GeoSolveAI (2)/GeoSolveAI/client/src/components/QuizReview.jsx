import React, { useState, useEffect } from 'react';
import '../styles/Quiz.css';

function QuizReview() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quiz-submissions', {
        headers: { 'X-Admin-Key': localStorage.getItem('adminEmail') }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      } else {
        setError('Failed to fetch submissions');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewSubmission = async (submissionId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quiz-submission/${submissionId}`, {
        headers: { 'X-Admin-Key': localStorage.getItem('adminEmail') }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissionDetails(data);
        setSelectedSubmission(submissionId);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (submissionDetails && selectedSubmission) {
    return (
      <div className="quiz-review-detail">
        <div className="review-header">
          <button className="btn-back" onClick={() => { setSelectedSubmission(null); setSubmissionDetails(null); }}>
            ← Back to Submissions
          </button>
          <h2>{submissionDetails.quiz_title}</h2>
          <div className="review-meta">
            <span className="meta-item">📧 {submissionDetails.user_email}</span>
            <span className="meta-item">📊 Score: {submissionDetails.score}/{submissionDetails.total}</span>
          </div>
        </div>

        <div className="review-questions">
          {submissionDetails.questions.map((q, idx) => (
            <div key={q.id} className={`review-question ${q.is_correct ? 'correct' : 'incorrect'}`}>
              <div className="question-header">
                <span className="q-number">Q{idx + 1}</span>
                <span className="q-status">{q.is_correct ? '✅ Correct' : '❌ Incorrect'}</span>
              </div>
              
              <h4>{q.text}</h4>
              
              <div className="review-options">
                {['a', 'b', 'c', 'd'].map(opt => {
                  const isUserAnswer = q.user_answer === opt;
                  const isCorrect = q.correct_answer === opt;
                  let className = 'review-option';
                  if (isUserAnswer && isCorrect) className += ' correct-selected';
                  else if (isUserAnswer && !isCorrect) className += ' incorrect-selected';
                  else if (isCorrect) className += ' correct-answer';
                  
                  return (
                    <div key={opt} className={className}>
                      <div className="option-label">{opt.toUpperCase()}</div>
                      <div className="option-text">{q.options[opt]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-review">
      <h2>📋 Review Quiz Submissions</h2>
      
      {error && <div className="message error">{error}</div>}

      {loading && <div className="loading">⏳ Loading submissions...</div>}

      {!loading && submissions.length === 0 ? (
        <div className="empty-state">No quiz submissions yet</div>
      ) : (
        <div className="submissions-table">
          <table>
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Student Email</th>
                <th>Score</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.quiz_title}</td>
                  <td>{sub.user_email}</td>
                  <td className="score-cell">
                    {sub.score}/{sub.total} ({Math.round((sub.score / sub.total) * 100)}%)
                  </td>
                  <td>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => viewSubmission(sub.id)}
                      disabled={loading}
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QuizReview;

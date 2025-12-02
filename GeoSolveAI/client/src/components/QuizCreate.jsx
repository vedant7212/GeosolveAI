import React, { useState, useCallback, useEffect } from 'react';
import '../styles/Quiz.css';

function QuizCreate({ onQuizCreated }) {
  // Load questions from sessionStorage on mount to preserve them
  const [questions, setQuestionsState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('quizQuestions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState({ a: '', b: '', c: '', d: '' });
  const [correct, setCorrect] = useState('a');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Wrapper to update both state and sessionStorage
  const setQuestions = useCallback((q) => {
    setQuestionsState(q);
    sessionStorage.setItem('quizQuestions', JSON.stringify(q));
  }, []);

  // Cleanup sessionStorage on successful quiz creation
  useEffect(() => {
    if (success) {
      sessionStorage.removeItem('quizQuestions');
    }
  }, [success]);

  const addQuestion = () => {
    if (!currentQuestion.trim() || !options.a.trim() || !options.b.trim() || !options.c.trim() || !options.d.trim()) {
      setError('All fields required');
      return;
    }
    
    const newQuestions = [...questions, {
      text: currentQuestion,
      a: options.a,
      b: options.b,
      c: options.c,
      d: options.d,
      correct: correct
    }];
    setQuestions(newQuestions);
    
    setCurrentQuestion('');
    setOptions({ a: '', b: '', c: '', d: '' });
    setCorrect('a');
    setError('');
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) {
      setError('Quiz needs a title and at least 1 question');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'X-Admin-Key': localStorage.getItem('adminEmail'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, questions })
      });

      if (response.ok) {
        setSuccess('Quiz created successfully! ✅');
        setTitle('');
        setDescription('');
        setQuestions([]);
        setTimeout(() => setSuccess(''), 3000);
        if (onQuizCreated) {
          onQuizCreated();
        }
      } else {
        setError('Failed to create quiz');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-create">
      <h2>📝 Create New Quiz</h2>
      
      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Quiz Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Algebra Basics"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this quiz..."
            className="form-input"
            rows="2"
          />
        </div>

        <div className="question-builder">
          <h3>Add Questions</h3>
          
          <div className="form-group">
            <label>Question {questions.length + 1}</label>
            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="What is the question?"
              className="form-input"
              rows="2"
            />
          </div>

          <div className="options-grid">
            {['a', 'b', 'c', 'd'].map(opt => (
              <div key={opt} className="form-group">
                <label>Option {opt.toUpperCase()}</label>
                <input
                  type="text"
                  value={options[opt]}
                  onChange={(e) => setOptions({...options, [opt]: e.target.value})}
                  placeholder={`Option ${opt.toUpperCase()}`}
                  className="form-input"
                />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Correct Answer</label>
            <select
              value={correct}
              onChange={(e) => setCorrect(e.target.value)}
              className="form-input"
            >
              <option value="a">Option A</option>
              <option value="b">Option B</option>
              <option value="c">Option C</option>
              <option value="d">Option D</option>
            </select>
          </div>

          <button type="button" className="btn-add-question" onClick={addQuestion}>
            ➕ Add Question
          </button>
        </div>

        {questions.length > 0 && (
          <div className="questions-list">
            <h3>Questions Added: {questions.length}</h3>
            {questions.map((q, idx) => (
              <div key={idx} className="question-item">
                <div>{idx + 1}. {q.text.substring(0, 60)}...</div>
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="btn-remove"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-create-quiz">
          {loading ? '⏳ Creating...' : '✅ Create Quiz'}
        </button>
      </form>
    </div>
  );
}

export default QuizCreate;

import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';
import QuizCreate from '../components/QuizCreate';
import QuizReview from '../components/QuizReview';
import SeatingArrangement from '../components/SeatingArrangement';

function AdminPanel({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResolved, setFilterResolved] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getAdminKey = () => localStorage.getItem('adminEmail') || '';

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const adminKey = getAdminKey();

      const [usersRes, feedbackRes, statsRes, quizzesRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { 'X-Admin-Key': adminKey } }),
        fetch('/api/admin/feedback', { headers: { 'X-Admin-Key': adminKey } }),
        fetch('/api/admin/stats', { headers: { 'X-Admin-Key': adminKey } }),
        fetch('/api/admin/quizzes', { headers: { 'X-Admin-Key': adminKey } })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        setFeedback(data.feedback || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': getAdminKey() }
      });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const handleResolveFeedback = async (feedbackId) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Key': getAdminKey(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolved: true })
      });
      if (response.ok) {
        setFeedback(feedback.map(f => 
          f.id === feedbackId ? { ...f, resolved: true } : f
        ));
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFeedback = feedback.filter(f => 
    filterResolved === 'all' || (filterResolved === 'resolved' ? f.resolved : !f.resolved)
  ).filter(f => 
    f.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    return 0;
  });

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': getAdminKey() }
      });
      if (response.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
      } else {
        setError('Failed to delete quiz');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const handleEditQuiz = (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) {
      sessionStorage.setItem('editingQuiz', JSON.stringify(quiz));
      setActiveTab('quizzes');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminEmail');
    onLogout();
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>🔐 GeoSolve Admin Dashboard</h1>
          <p>Comprehensive platform management & analytics</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Dashboard */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.total_users || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-label">Feedback Received</div>
              <div className="stat-value">{stats.total_feedback || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Resolved Issues</div>
              <div className="stat-value">{stats.resolved_feedback || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-label">Pending Issues</div>
              <div className="stat-value">{(stats.total_feedback || 0) - (stats.resolved_feedback || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          💬 Feedback ({feedback.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          📝 Create Quiz
        </button>
        <button
          className={`tab-button ${activeTab === 'quiz-review' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz-review')}
        >
          📋 Review Submissions
        </button>
        <button
          className={`tab-button ${activeTab === 'seating' ? 'active' : ''}`}
          onClick={() => setActiveTab('seating')}
        >
          🎓 Exam Seating
        </button>
      </div>

      {loading ? (
        <div className="loading">⏳ Loading data...</div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="admin-section">
              <h2>📈 Platform Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Recent Users</h3>
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="recent-item">
                      <div className="avatar">{getInitials(u.name)}</div>
                      <div className="item-info">
                        <div className="item-name">{u.name}</div>
                        <div className="item-email">{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="overview-card">
                  <h3>Recent Feedback</h3>
                  {feedback.slice(0, 5).map(f => (
                    <div key={f.id} className="recent-item">
                      <div className="feedback-badge">{f.resolved ? '✅' : '⏳'}</div>
                      <div className="item-info">
                        <div className="item-name">{f.user_email}</div>
                        <div className="item-text">{f.message.substring(0, 50)}...</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Registered Users</h2>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              {filteredUsers.length === 0 ? (
                <div className="empty-state">👤 No users found</div>
              ) : (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || '—'}</td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete user"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Quizzes Tab - Create */}
          {activeTab === 'quizzes' && (
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <QuizCreate onQuizCreated={fetchAllData} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="admin-section">
                  <div className="section-header">
                    <h2>📋 All Quizzes</h2>
                  </div>
                  {quizzes.length === 0 ? (
                    <div className="empty-state">No quizzes created yet</div>
                  ) : (
                    <div className="quizzes-grid">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="quiz-card">
                          <div className="quiz-card-header">
                            <h3>{quiz.title}</h3>
                            <span className="quiz-badge">{quiz.questions?.length || 0} Q</span>
                          </div>
                          <p className="quiz-description">{quiz.description || 'No description'}</p>
                          <div className="quiz-meta">
                            <span>📅 Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                          </div>
                          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button 
                              className="btn-action"
                              onClick={() => handleEditQuiz(quiz.id)}
                              style={{ flex: 1, background: '#1db5a6', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              style={{ flex: 1, background: '#dc3545', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quiz-review' && (
            <QuizReview />
          )}

          {activeTab === 'seating' && (
            <SeatingArrangement />
          )}

          {activeTab === 'feedback' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>User Feedback & Complaints</h2>
                <div className="filter-group">
                  <select 
                    value={filterResolved} 
                    onChange={(e) => setFilterResolved(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Issues</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="resolved">✅ Resolved</option>
                  </select>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                  <input
                    type="text"
                    placeholder="🔍 Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              {sortedFeedback.length === 0 ? (
                <div className="empty-state">💬 No feedback found</div>
              ) : (
                <div className="feedback-list">
                  {sortedFeedback.map((item) => (
                    <div key={item.id} className={`feedback-card ${item.resolved ? 'resolved' : ''}`}>
                      <div className="feedback-header">
                        <div className="feedback-left">
                          <span className="feedback-status">{item.resolved ? '✅ Resolved' : '⏳ Pending'}</span>
                          <strong>{item.user_email}</strong>
                        </div>
                        <span className="feedback-date">
                          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="feedback-message">{item.message}</p>
                      {!item.resolved && (
                        <button 
                          className="btn-resolve"
                          onClick={() => handleResolveFeedback(item.id)}
                        >
                          ✅ Mark as Resolved
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="admin-footer">
        <button className="btn-refresh" onClick={fetchAllData}>
          🔄 Refresh Data
        </button>
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default AdminPanel;

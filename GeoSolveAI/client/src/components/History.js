import React, { useState } from 'react';

function History({ user }) {
  const [filter, setFilter] = useState('all');

  const allSessions = [
    { id: 1, name: 'Quadratic Equations', tool: 'Math Solver', date: '2 hours ago', status: 'completed' },
    { id: 2, name: 'Triangle Properties', tool: 'Geometry Visualizer', date: '1 day ago', status: 'completed' },
    { id: 3, name: 'Integration Practice', tool: 'Math Solver', date: '2 days ago', status: 'in-progress' },
    { id: 4, name: 'Calculus Review Chat', tool: 'AI Tutor', date: '3 days ago', status: 'completed' },
    { id: 5, name: 'PDF Homework Assignment', tool: 'Multimodal Input', date: '4 days ago', status: 'completed' },
    { id: 6, name: 'Circle Theorems', tool: 'Geometry Visualizer', date: '5 days ago', status: 'completed' },
    { id: 7, name: 'Derivative Problems', tool: 'Math Solver', date: '1 week ago', status: 'in-progress' },
    { id: 8, name: 'Sketch to Equation', tool: 'Multimodal Input', date: '1 week ago', status: 'completed' }
  ];

  const filteredSessions = filter === 'all' 
    ? allSessions 
    : allSessions.filter(s => s.status === filter);

  const handleResume = (sessionName) => {
    alert(`Resuming: ${sessionName}`);
  };

  const handleView = (sessionName) => {
    alert(`Viewing: ${sessionName}`);
  };

  const handleDelete = (sessionName) => {
    if (window.confirm(`Delete "${sessionName}"?`)) {
      alert(`Deleted: ${sessionName}`);
    }
  };

  const handleExport = (format) => {
    alert(`Exporting history as ${format.toUpperCase()}`);
  };

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <h2>📜 Your Session History</h2>
          <p>View and manage all your past learning sessions</p>
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Sessions
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            ✓ Completed
          </button>
          <button 
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            ⟳ In Progress
          </button>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="sessions-table">
            <table>
              <thead>
                <tr>
                  <th>Session Name</th>
                  <th>Tool</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map(session => (
                  <tr key={session.id}>
                    <td><strong>{session.name}</strong></td>
                    <td>{session.tool}</td>
                    <td>{session.date}</td>
                    <td>
                      <span className={`status-badge ${session.status}`}>
                        {session.status === 'completed' ? '✓ Completed' : '⟳ In Progress'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {session.status === 'in-progress' ? (
                          <button 
                            className="btn-action resume"
                            onClick={() => handleResume(session.name)}
                          >
                            Resume
                          </button>
                        ) : (
                          <button 
                            className="btn-action view"
                            onClick={() => handleView(session.name)}
                          >
                            View
                          </button>
                        )}
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDelete(session.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No sessions found</p>
          </div>
        )}

        <div className="export-section">
          <h3>📥 Export History</h3>
          <div className="export-buttons">
            <button className="btn-export" onClick={() => handleExport('pdf')}>
              Export as PDF
            </button>
            <button className="btn-export" onClick={() => handleExport('csv')}>
              Export as CSV
            </button>
            <button className="btn-export" onClick={() => handleExport('json')}>
              Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;

import React, { useState } from 'react';
import '../styles/Dashboard.css';
import '../styles/Community.css';
import MathTab from './MathTab';
import GeometryTab from './GeometryTab';
import MultimodalTab from './MultimodalTab';
import AITutor from './AITutor';
import Quiz from './Quiz';
import Profile from './Profile';
import Settings from './Settings';
import History from './History';
import Community from './Community';

function Dashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeTool, setActiveTool] = useState(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const getUserName = () => {
    if (!user) return 'Student';
    if (typeof user === 'object' && user.name) return user.name;
    if (typeof user === 'string') return user;
    return 'Student';
  };

  const tools = [
    {
      id: 'math',
      name: 'Math Solver',
      icon: '🔢',
      description: 'Algebra • Calculus',
      details: 'Type any equation or expression and get step-by-step, fully explained solutions.',
      lastUsed: '2h ago'
    },
    {
      id: 'geometry',
      name: 'Geometry Visualizer',
      icon: '📐',
      description: 'Diagrams • Proofs',
      details: 'Build and manipulate triangles, circles, and vectors with live, AI-annotated diagrams.',
      lastUsed: 'Yesterday'
    },
    {
      id: 'multimodal',
      name: 'Multimodal Input',
      icon: '🖼️',
      description: 'Image • PDF • Sketch',
      details: 'Upload problem sheets, photos, or rough sketches and let GeoSolve parse and explain them.',
      lastUsed: '3d ago'
    },
    {
      id: 'aitutor',
      name: 'AI Tutor / Explain Mode',
      icon: '🧠',
      description: 'Guided learning',
      details: 'Chat with an AI tutor that breaks concepts down in your style and pace, powered by J.A.R.V.I.S  .',
      lastUsed: 'Never'
    },
    {
      id: 'quiz',
      name: 'Quiz Practice',
      icon: '📚',
      description: 'Test your knowledge',
      details: 'Take quizzes created by your instructor to test and strengthen your understanding.',
      lastUsed: 'Available'
    }
  ];

  const recentSessions = [
    { name: 'Limits & continuity set', tool: 'math', questions: '12 questions', date: '2h ago', status: 'resume' },
    { name: 'Triangle similarity proofs', tool: 'geometry', questions: '20 ago', date: '20 ago', status: 'open' },
    { name: 'Board exam revision chat', tool: 'aitutor', questions: '3d ago', date: '3d ago', status: 'open' },
    { name: 'Pro tip for Vedant', tool: 'multimodal', questions: 'Sample paper in', date: 'now', status: 'maybe' }
  ];

  const handleSessionAction = (session) => {
    if (session.status === 'maybe') return;
    setActiveTool(session.tool);
  };

  if (activeTool) {
    return (
      <div className="tool-view">
        <div className="tool-header">
          <button className="btn-back" onClick={() => setActiveTool(null)}>← Back to Dashboard</button>
        </div>
        {activeTool === 'math' && <MathTab />}
        {activeTool === 'geometry' && <GeometryTab />}
        {activeTool === 'multimodal' && <MultimodalTab />}
        {activeTool === 'aitutor' && <AITutor />}
        {activeTool === 'quiz' && <Quiz userEmail={typeof user === 'object' ? user.email : user} />}
      </div>
    );
  }

  if (activeMenu === 'profile') {
    return (
      <div className="dashboard-container">
        <button className="btn-collapse-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-section">
            <dotlottie-wc src="https://lottie.host/54d0d5bc-f6f6-4c67-a3fb-b97e3867b972/0MpXUJ0PED.lottie" style={{width: '60px', height: '60px'}} autoplay={true} loop={true}></dotlottie-wc>
            <div className="logo-text">
              <h3>GeoSolve</h3>
              <p>by CALCORE</p>
            </div>
          </div>

          <div className="workspace-section">
            <h4>Workspace</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('dashboard')}>
                📊 Dashboard
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('history')}>
                📜 History
              </button>
              <button className="nav-item active" onClick={() => setActiveMenu('profile')}>
                👤 Profile
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('settings')}>
                ⚙️ Settings
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('community')}>
                🌍 Community
              </button>
            </nav>
          </div>

          <div className="session-section">
            <h4>Session</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('history')}>
                ⏱️ Recent sets
              </button>
              <button className="nav-item logout" onClick={onLogout}>
                🚪 Logout
              </button>
            </nav>
          </div>

          <div className="user-card">
            <div className="user-avatar">{typeof user === 'object' ? user.name?.charAt(0).toUpperCase() : user?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{typeof user === 'object' ? user.name : user}</p>
              <p className="user-status">Student • Premium</p>
            </div>
            <p className="user-note">You're securely signed in. All sessions are auto-saved.</p>
          </div>
        </div>

        <div className="main-content">
          <Profile user={user} />
        </div>
      </div>
    );
  }

  if (activeMenu === 'settings') {
    return (
      <div className="dashboard-container">
        <button className="btn-collapse-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-section">
            <dotlottie-wc src="https://lottie.host/54d0d5bc-f6f6-4c67-a3fb-b97e3867b972/0MpXUJ0PED.lottie" style={{width: '60px', height: '60px'}} autoplay={true} loop={true}></dotlottie-wc>
            <div className="logo-text">
              <h3>GeoSolve</h3>
              <p>by CALCORE</p>
            </div>
          </div>

          <div className="workspace-section">
            <h4>Workspace</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('dashboard')}>
                📊 Dashboard
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('history')}>
                📜 History
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('profile')}>
                👤 Profile
              </button>
              <button className="nav-item active" onClick={() => setActiveMenu('settings')}>
                ⚙️ Settings
              </button>
            </nav>
          </div>

          <div className="session-section">
            <h4>Session</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('history')}>
                ⏱️ Recent sets
              </button>
              <button className="nav-item logout" onClick={onLogout}>
                🚪 Logout
              </button>
            </nav>
          </div>

          <div className="user-card">
            <div className="user-avatar">{typeof user === 'object' ? user.name?.charAt(0).toUpperCase() : user?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{typeof user === 'object' ? user.name : user}</p>
              <p className="user-status">Student • Premium</p>
            </div>
            <p className="user-note">You're securely signed in. All sessions are auto-saved.</p>
          </div>
        </div>

        <div className="main-content">
          <Settings user={user} />
        </div>
      </div>
    );
  }

  if (activeMenu === 'community') {
    return (
      <div className="dashboard-container">
        <button className="btn-collapse-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-section">
            <dotlottie-wc src="https://lottie.host/54d0d5bc-f6f6-4c67-a3fb-b97e3867b972/0MpXUJ0PED.lottie" style={{width: '60px', height: '60px'}} autoplay={true} loop={true}></dotlottie-wc>
            <div className="logo-text">
              <h3>GeoSolve</h3>
              <p>by CALCORE</p>
            </div>
          </div>
          <div className="workspace-section">
            <h4>Workspace</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('dashboard')}>📊 Dashboard</button>
              <button className="nav-item" onClick={() => setActiveMenu('history')}>📜 History</button>
              <button className="nav-item" onClick={() => setActiveMenu('profile')}>👤 Profile</button>
              <button className="nav-item" onClick={() => setActiveMenu('settings')}>⚙️ Settings</button>
              <button className="nav-item active" onClick={() => setActiveMenu('community')}>🌍 Community</button>
            </nav>
          </div>
          <div className="session-section">
            <h4>Session</h4>
            <nav className="nav-menu">
              <button className="nav-item logout" onClick={onLogout}>🚪 Logout</button>
            </nav>
          </div>
          <div className="user-card">
            <div className="user-avatar">{getUserName().charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{getUserName()}</p>
              <p className="user-status">Student • Premium</p>
            </div>
            <p className="user-note">You're securely signed in. All sessions are auto-saved.</p>
          </div>
        </div>
        <div className="main-content">
          <Community user={user} />
        </div>
      </div>
    );
  }

  if (activeMenu === 'history') {
    return (
      <div className="dashboard-container">
        <button className="btn-collapse-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-section">
            <dotlottie-wc src="https://lottie.host/54d0d5bc-f6f6-4c67-a3fb-b97e3867b972/0MpXUJ0PED.lottie" style={{width: '60px', height: '60px'}} autoplay={true} loop={true}></dotlottie-wc>
            <div className="logo-text">
              <h3>GeoSolve</h3>
              <p>by CALCORE</p>
            </div>
          </div>

          <div className="workspace-section">
            <h4>Workspace</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('dashboard')}>
                📊 Dashboard
              </button>
              <button className="nav-item active" onClick={() => setActiveMenu('history')}>
                📜 History
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('profile')}>
                👤 Profile
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('settings')}>
                ⚙️ Settings
              </button>
              <button className="nav-item" onClick={() => setActiveMenu('community')}>
                🌍 Community
              </button>
            </nav>
          </div>

          <div className="session-section">
            <h4>Session</h4>
            <nav className="nav-menu">
              <button className="nav-item" onClick={() => setActiveMenu('history')}>
                ⏱️ Recent sets
              </button>
              <button className="nav-item logout" onClick={onLogout}>
                🚪 Logout
              </button>
            </nav>
          </div>

          <div className="user-card">
            <div className="user-avatar">{typeof user === 'object' ? user.name?.charAt(0).toUpperCase() : user?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{typeof user === 'object' ? user.name : user}</p>
              <p className="user-status">Student • Premium</p>
            </div>
            <p className="user-note">You're securely signed in. All sessions are auto-saved.</p>
          </div>
        </div>

        <div className="main-content">
          <History user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <button className="btn-collapse-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-section">
          <div className="logo-circle">G</div>
          <div className="logo-text">
            <h3>GeoSolve</h3>
            <p>by CALCORE</p>
          </div>
        </div>

        <div className="workspace-section">
          <h4>Workspace</h4>
          <nav className="nav-menu">
            <button className="nav-item active" onClick={() => setActiveMenu('dashboard')}>
              📊 Dashboard
            </button>
            <button className="nav-item" onClick={() => setActiveMenu('history')}>
              📜 History
            </button>
            <button className="nav-item" onClick={() => setActiveMenu('profile')}>
              👤 Profile
            </button>
            <button className="nav-item" onClick={() => setActiveMenu('settings')}>
              ⚙️ Settings
            </button>
            <button className="nav-item" onClick={() => setActiveMenu('community')}>
              🌍 Community
            </button>
          </nav>
        </div>

        <div className="session-section">
          <h4>Session</h4>
          <nav className="nav-menu">
            <button className="nav-item" onClick={() => setActiveMenu('history')}>
              ⏱️ Recent sets
            </button>
            <button className="nav-item logout" onClick={onLogout}>
              🚪 Logout
            </button>
          </nav>
        </div>

        <div className="user-card">
          <div className="user-avatar">{getUserName().charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <p className="user-name">{getUserName()}</p>
            <p className="user-status">Student • Premium</p>
          </div>
          <p className="user-note">You're securely signed in. All sessions are auto-saved.</p>
        </div>
      </div>

      <div className="main-content">
        <div className="header-bar">
          <div>
            <h2>Welcome back, {getUserName()}! 👋</h2>
            <p>Ready to solve something today?</p>
          </div>
          <div className="header-right">
            <span className="workspace-status">AI workspace is ready</span>
            <button className="btn-start-solving" onClick={() => setActiveTool('math')}>
              🚀 Start Solving
            </button>
            <span className="notification-icon">🔔</span>
          </div>
        </div>

        <div className="content-area">
          <div className="left-panel">
            {showWelcomeBanner && (
              <div className="welcome-box">
                <button className="btn-close-banner" onClick={() => setShowWelcomeBanner(false)} title="Close banner">
                  ✕
                </button>
                <h3>Welcome back, {getUserName()}! Ready to solve something today?</h3>
                <p>Jump into a new problem set or resume where you left off in your last session.</p>
                <button className="btn-quicksolve" onClick={() => setActiveTool('math')}>
                  → Start a quick solve
                </button>
              </div>
            )}

            <div className="tools-section">
              <div className="section-header">
                <h3>Core tools</h3>
                <p>Choose how you want GeoSolve to help right now.</p>
              </div>

              <div className="tools-grid">
                {tools.map((tool) => (
                  <div key={tool.id} className="tool-card" onClick={() => setActiveTool(tool.id)}>
                    <div className="tool-header-card">
                      <span className="tool-icon">{tool.icon}</span>
                      <h4>{tool.name}</h4>
                      <p className="tool-subtitle">{tool.description}</p>
                    </div>
                    <p className="tool-description">{tool.details}</p>
                    <div className="tool-footer">
                      <span className="last-used">Last used • {tool.lastUsed}</span>
                      <button className="btn-start" onClick={(e) => { e.stopPropagation(); setActiveTool(tool.id); }}>Start →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="view-all" onClick={() => setActiveMenu('history')}>View all modes →</button>
          </div>

          <div className="right-panel">
            <div className="sessions-box">
              <div className="sessions-header">
                <h3>Recent sessions</h3>
                <p>Pick up from where you left off.</p>
                <button className="view-history" onClick={() => setActiveMenu('history')}>View history →</button>
              </div>

              <div className="sessions-list">
                {recentSessions.map((session, idx) => (
                  <div key={idx} className="session-item">
                    <div className="session-info">
                      <h4>{session.name}</h4>
                      <p className="session-type">{session.tool} • {session.questions}</p>
                    </div>
                    <button 
                      className="btn-session" 
                      onClick={() => handleSessionAction(session)}
                      style={{opacity: session.status === 'maybe' ? 0.5 : 1, cursor: session.status === 'maybe' ? 'default' : 'pointer'}}
                    >
                      {session.status === 'resume' ? 'Resume' : session.status === 'open' ? 'Open' : 'Maybe later'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="promo-box">
              <div className="promo-header">
                <span>⭐</span>
                <h4>Pro tip for {getUserName()}</h4>
              </div>
              <p>Try uploading your full sample paper in Multimodal Input. GeoSolve can help you sort and solve every question with explanations.</p>
              <div className="promo-buttons">
                <button className="btn-upload" onClick={() => setActiveTool('multimodal')}>
                  📤 Upload a paper
                </button>
                <button className="btn-later">Maybe later</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

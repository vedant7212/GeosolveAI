import React, { useState } from 'react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const device = useDeviceDetection();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignup) {
      if (!fullName || !email || !password) {
        setError('Please fill in all fields');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      if (isSignup) {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.removeItem('admin');
          localStorage.setItem('geosolveUser', JSON.stringify({ name: fullName, email }));
          onLogin({ name: fullName, email }, 'student');
        } else {
          setError(data.message || 'Signup failed');
        }
      } else {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.status === 200 && data.success && data.role === 'admin') {
          localStorage.setItem('admin', 'true');
          localStorage.setItem('adminEmail', email);
          localStorage.setItem('geosolveUser', JSON.stringify({ name: email.split('@')[0], email }));
          onLogin({ name: email.split('@')[0], email }, 'admin');
        } else {
          const userName = email.split('@')[0];
          localStorage.removeItem('admin');
          localStorage.setItem('geosolveUser', JSON.stringify({ name: fullName || userName, email }));
          onLogin({ name: fullName || userName, email }, 'student');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const userName = email.split('@')[0];
      localStorage.removeItem('admin');
      localStorage.setItem('geosolveUser', JSON.stringify({ name: fullName || userName, email }));
      onLogin({ name: fullName || userName, email }, 'student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem('geosolveUser', JSON.stringify({ name: 'Guest', email: 'guest@geosolve.local' }));
    onLogin({ name: 'Guest', email: 'guest@geosolve.local' }, 'student');
  };

  return (
    <div className={`login-container ${device.device}`}>
      <div className="device-indicator" style={{position: 'fixed', top: '10px', right: '10px', padding: '8px 12px', background: '#1db5a6', color: 'white', borderRadius: '4px', fontSize: '12px', zIndex: 9999}}>
        📱 {device.device.toUpperCase()} ({device.width}x{device.height})
      </div>
      <div className="login-left">
        <div className="login-logo">
          <dotlottie-wc className="logo-animation" src="https://lottie.host/54d0d5bc-f6f6-4c67-a3fb-b97e3867b972/0MpXUJ0PED.lottie" autoplay loop></dotlottie-wc>
          <div className="logo-text">
            <h2>GeoSolve by CALCORE</h2>
            <p>AI-Powered Math & Geometry Workspace</p>
          </div>
        </div>
        
        <p className="login-intro">Sign in to continue solving, plotting, and visualizing.</p>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">∫</span>
            <p>Instant solutions with step-by-step reasoning for algebra and calculus.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">△</span>
            <p>Interactive geometry diagrams for triangles, circles, and more.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">◆</span>
            <p>Upload problems, sketches, or PDFs in the multimodal workspace.</p>
          </div>
        </div>

        <div className="login-decorations">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h3>{isSignup ? 'Create Account' : 'Welcome back'}</h3>
          <p>{isSignup ? 'Join GeoSolve to start learning' : 'Log in to access your GeoSolve workspace and saved sessions.'}</p>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@student.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password <span className="password-hint">At least 8 characters</span></label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#forgot" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="btn-signin">{isSignup ? 'Create Account' : 'Sign in'}</button>
          </form>

          <button type="button" className="btn-guest" onClick={handleGuestLogin}>
            Continue as guest
          </button>

          {!isSignup && <div className="divider">Or sign in with</div>}

          {!isSignup && <button type="button" className="btn-social github">
            GitHub
          </button>}

          <p className="signup-link">
            {isSignup ? (
              <>Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); setIsSignup(false); setError(''); setFullName(''); }}>Sign in</a></>
            ) : (
              <>No account yet? <a href="#signup" onClick={(e) => { e.preventDefault(); setIsSignup(true); setError(''); }}>Create a free student account</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

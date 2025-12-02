import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './styles/DarkTheme.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    try {
      const isAdmin = localStorage.getItem('admin') === 'true';
      const adminEmail = localStorage.getItem('adminEmail');
      const savedUser = localStorage.getItem('geosolveUser');
      
      if (isAdmin && adminEmail) {
        setUser(adminEmail);
        setRole('admin');
      } else if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && (parsedUser.name || parsedUser.email)) {
            setUser(parsedUser);
            setRole('student');
          } else {
            localStorage.removeItem('geosolveUser');
          }
        } catch (e) {
          localStorage.removeItem('geosolveUser');
        }
      }
    } catch (err) {
      console.error('Error loading user from storage:', err);
    }
  }, []);

  const handleLogin = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    
    // Handle both object and string formats
    if (typeof userData === 'object') {
      localStorage.setItem('geosolveUser', JSON.stringify(userData));
    } else {
      localStorage.setItem('geosolveUser', userData);
    }
    
    if (userRole === 'admin') {
      localStorage.setItem('admin', 'true');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('geosolveUser');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminEmail');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (role === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;

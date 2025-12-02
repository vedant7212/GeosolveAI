import React, { useState } from 'react';

function Settings({ user }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: false,
    autoSave: true,
    difficulty: 'Standard',
    showHints: true,
    soundEnabled: false
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (e) => {
    setSettings(prev => ({ ...prev, difficulty: e.target.value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      alert('History cleared successfully');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('This will permanently delete your account and all data. Continue?')) {
      alert('Account deletion initiated');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h2>⚙️ Settings</h2>

        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="setting-item">
            <div className="setting-label">
              <label>Email Notifications</label>
              <p>Get updates about your sessions and achievements</p>
            </div>
            <div className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <label>Sound Enabled</label>
              <p>Play sound effects during interactions</p>
            </div>
            <div className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={() => handleToggle('soundEnabled')}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Learning Preferences</h3>
          <div className="setting-item">
            <div className="setting-label">
              <label>Default Difficulty Level</label>
              <p>Choose your preferred difficulty for new problems</p>
            </div>
            <select 
              className="difficulty-select"
              value={settings.difficulty}
              onChange={handleSelectChange}
            >
              <option>High School</option>
              <option>Standard</option>
              <option>College</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <label>Show Hints</label>
              <p>Display hints while solving problems</p>
            </div>
            <div className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.showHints}
                onChange={() => handleToggle('showHints')}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Privacy & Storage</h3>
          <div className="setting-item">
            <div className="setting-label">
              <label>Auto-Save Sessions</label>
              <p>Automatically save your work</p>
            </div>
            <div className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={() => handleToggle('autoSave')}
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <label>Dark Mode</label>
              <p>Use dark theme (Coming soon)</p>
            </div>
            <div className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Data Management</h3>
          <div className="danger-buttons">
            <button 
              className="btn-danger"
              onClick={handleClearHistory}
            >
              🗑️ Clear All History
            </button>
            <button 
              className="btn-danger"
              onClick={() => alert('Exporting data...')}
            >
              📥 Export My Data
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Account</h3>
          <div className="danger-buttons">
            <button 
              className="btn-danger"
              onClick={handleDeleteAccount}
            >
              ❌ Delete Account
            </button>
          </div>
        </div>

        <button className="btn-save-settings" onClick={handleSave}>
          💾 Save All Settings
        </button>

        {saved && <div className="save-confirmation">✓ Settings saved successfully</div>}
      </div>
    </div>
  );
}

export default Settings;

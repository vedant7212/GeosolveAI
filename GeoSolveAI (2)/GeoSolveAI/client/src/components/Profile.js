import React, { useState, useEffect } from 'react';

function Profile({ user }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Student',
    email: 'student@example.com',
    school: '',
    grade: '',
    bio: ''
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      let userName = 'Student';
      let userEmail = 'student@example.com';
      
      if (user) {
        if (typeof user === 'object' && user.name) {
          userName = user.name || 'Student';
          userEmail = user.email || 'student@example.com';
        } else if (typeof user === 'string') {
          userName = user || 'Student';
        }
      }
      
      setFormData({
        name: userName,
        email: userEmail,
        school: localStorage.getItem('userSchool') || '',
        grade: localStorage.getItem('userGrade') || '',
        bio: localStorage.getItem('userBio') || 'Math enthusiast'
      });
    } catch (error) {
      setFormData({
        name: 'Student',
        email: 'student@example.com',
        school: '',
        grade: '',
        bio: 'Math enthusiast'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('userName', formData.name);
    localStorage.setItem('userEmail', formData.email);
    localStorage.setItem('userSchool', formData.school);
    localStorage.setItem('userGrade', formData.grade);
    localStorage.setItem('userBio', formData.bio);
    
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const getInitial = (name) => {
    return (name || 'S')[0].toUpperCase();
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">{getInitial(formData.name)}</div>
          <div className="profile-header-info">
            <h2>{formData.name}'s Profile</h2>
            <p>Student • Member</p>
            <p className="joined">Joined December 2024</p>
          </div>
        </div>

        {editing ? (
          <div className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>School</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Grade</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
              />
            </div>
            <div className="form-buttons">
              <button className="btn-save" onClick={handleSave}>Save Changes</button>
              <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="profile-info">
              <div className="info-group">
                <label>Name</label>
                <p>{formData.name}</p>
              </div>
              <div className="info-group">
                <label>Email</label>
                <p>{formData.email}</p>
              </div>
              <div className="info-group">
                <label>School</label>
                <p>{formData.school}</p>
              </div>
              <div className="info-group">
                <label>Grade</label>
                <p>{formData.grade}</p>
              </div>
              <div className="info-group">
                <label>Bio</label>
                <p>{formData.bio}</p>
              </div>
            </div>
            <button className="btn-edit" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
            {saved && <div className="save-confirmation">✓ Changes saved successfully</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;

import React, { useState, useRef, useEffect } from 'react';

function Community({ user }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { id: 1, author: 'Priya Sharma', avatar: 'P', message: 'Hey everyone! Who wants to discuss integration problems?', timestamp: '10:30 AM', reactions: { '👍': 5, '❤️': 2 } },
    { id: 2, author: 'Arjun Patel', avatar: 'A', message: 'I\'m stuck on u-substitution. Can anyone help?', timestamp: '10:32 AM', reactions: { '👍': 3 } },
    { id: 3, author: 'Admin', avatar: 'A', message: 'Check the pinned resource on calculus shortcuts!', timestamp: '10:35 AM', reactions: { '👍': 8, '🔥': 4 } },
    { id: 4, author: 'New User ', avatar: 'V', message: 'Thanks! That really helped. The shortcut trick was amazing 🙌', timestamp: '10:00 AM', reactions: { '❤️': 96 } }
  ]);

  const [documents, setDocuments] = useState([
    { id: 1, name: 'Calculus_Notes.pdf', uploader: 'Vedant Kumar', downloads: 124, size: '2.4 MB', date: '3 days ago', subject: 'Calculus' },
    { id: 2, name: 'Geometry_Shortcuts.pdf', uploader: 'Priya Sharma', downloads: 89, size: '1.8 MB', date: '1 week ago', subject: 'Geometry' },
    { id: 3, name: 'Algebra_Formulas.pdf', uploader: 'Admin', downloads: 256, size: '3.2 MB', date: '2 weeks ago', subject: 'Algebra' }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [docSubject, setDocSubject] = useState('Calculus');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userName = typeof user === 'object' ? user.name : user;
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          author: userName || 'You',
          avatar: (userName || 'Y').charAt(0).toUpperCase(),
          message: newMessage,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          reactions: {}
        }
      ]);
      setNewMessage('');
    }
  };

  const handleReaction = (messageId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (reactions[emoji]) {
          reactions[emoji]++;
        } else {
          reactions[emoji] = 1;
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const handleUploadDocument = () => {
    if (selectedFile) {
      setDocuments([
        {
          id: documents.length + 1,
          name: selectedFile,
          uploader: typeof user === 'object' ? user.name : user,
          downloads: 0,
          size: '1.5 MB',
          date: 'Just now',
          subject: docSubject
        },
        ...documents
      ]);
      setSelectedFile(null);
      alert('Document uploaded successfully!');
    }
  };

  const handleDownloadDocument = (docName) => {
    alert(`Downloading ${docName}...`);
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => msg.message.toLowerCase().includes(searchQuery.toLowerCase()) || msg.author.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const reactionEmojis = ['👍', '❤️', '😂', '🔥', '🎉', '😮', '😢', '🤔'];

  return (
    <div className="community-chat">
      <div className="community-header-chat">
        <h2>🌍 GeoSolve Community Chat</h2>
        <p>Connect, discuss, and learn together in real-time</p>
      </div>

      <div className="community-tabs-chat">
        <button className={`tab-btn-chat ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>💬 Group Chat</button>
        <button className={`tab-btn-chat ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>📄 Documents & Resources</button>
      </div>

      {/* GROUP CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="chat-container">
          <div className="chat-main">
            <div className="chat-header">
              <h3>📢 General Discussion</h3>
              <div className="chat-search">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-chat"
                />
              </div>
            </div>

            <div className="messages-area">
              {filteredMessages.length === 0 ? (
                <div className="no-messages">No messages found. Start the conversation!</div>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="message-bubble">
                    <div className="message-header">
                      <div className="user-avatar-chat">{msg.avatar}</div>
                      <div className="message-info">
                        <span className="author-name">{msg.author}</span>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                    </div>
                    <div className="message-content">
                      {msg.message}
                    </div>
                    <div className="message-reactions">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          className="reaction-badge"
                          onClick={() => handleReaction(msg.id, emoji)}
                          title={`${count} ${emoji}`}
                        >
                          {emoji} {count}
                        </button>
                      ))}
                      <div className="reaction-menu">
                        {reactionEmojis.map(emoji => (
                          <button
                            key={emoji}
                            className="reaction-option"
                            onClick={() => handleReaction(msg.id, emoji)}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message here... (Shift+Enter for new line)"
                className="message-textarea-chat"
                rows={3}
              />
              <button className="btn-send-message" onClick={handleSendMessage}>
                📤 Send Message
              </button>
            </div>
          </div>

          <div className="chat-sidebar">
            <div className="members-panel">
              <h4>👥 Active Members</h4>
              <div className="members-list">
                {['Priya Sharma', 'Arjun Patel', 'Vedant Kumar', 'Ananya Gupta', 'Neha Verma'].map((member, idx) => (
                  <div key={idx} className="member-item">
                    <div className="member-status online"></div>
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-panel">
              <h4>ℹ️ Channel Info</h4>
              <div className="info-content">
                <p><strong>Members:</strong> 245</p>
                <p><strong>Messages:</strong> {messages.length}</p>
                <p><strong>Created:</strong> 2 weeks ago</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="documents-container">
          <div className="documents-main">
            <div className="upload-section">
              <h3>📚 Share Your Resources</h3>
              <div className="upload-form">
                <div className="form-group">
                  <label>Document Subject</label>
                  <select value={docSubject} onChange={(e) => setDocSubject(e.target.value)} className="subject-select">
                    <option>Calculus</option>
                    <option>Geometry</option>
                    <option>Algebra</option>
                    <option>Physics</option>
                    <option>Statistics</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>File Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Study_Notes.pdf"
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="file-name-input"
                  />
                </div>
                <button className="btn-upload-doc" onClick={handleUploadDocument}>📤 Upload Document</button>
              </div>
            </div>

            <div className="documents-list-section">
              <h3>📖 Available Resources</h3>
              {documents.map(doc => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-icon">📄</div>
                  <div className="doc-details">
                    <h5>{doc.name}</h5>
                    <p className="doc-meta">By {doc.uploader} • {doc.size} • {doc.date}</p>
                    <p className="doc-subject">📚 {doc.subject}</p>
                    <p className="download-count">📥 {doc.downloads} downloads</p>
                  </div>
                  <button className="btn-download-doc" onClick={() => handleDownloadDocument(doc.name)}>
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Community;

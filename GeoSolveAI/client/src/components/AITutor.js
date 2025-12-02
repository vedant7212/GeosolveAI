import React, { useState } from 'react';
import axios from 'axios';

function AITutor() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I\'m your AI tutor. What concept would you like me to explain today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const suggestions = [
    'Explain derivatives',
    'Help with algebra',
    'Geometry formulas',
    'Calculus tips'
  ];

  const handleSendMessage = async () => {
    if (!input.trim() && !uploadedFile) return;

    const userMessage = input;
    setMessages([...messages, { type: 'user', text: userMessage || 'Analyzing document...' }]);
    setInput('');
    setUploadedFile(null);
    setLoading(true);

    try {
      const prompt = uploadedFile 
        ? `Analyze this: ${uploadedFile.name}. ${userMessage}`
        : userMessage;

      const response = await axios.post('/api/gemini', {
        prompt: prompt,
        difficulty: 'Standard',
        maxLength: 300
      });
      setMessages(prev => [...prev, { type: 'bot', text: response.data.explanation }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. ' + (error.response?.data?.error || error.message) }]);
    }
    setLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleFileUpload = (e) => {
    if (e.target.files[0]) {
      setUploadedFile({
        name: e.target.files[0].name,
        size: e.target.files[0].size
      });
    }
  };

  return (
    <div className="ai-tutor">
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.type}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
          {loading && <div className="message bot"><div className="typing">Thinking...</div></div>}
        </div>

        {messages.length === 1 && (
          <div className="suggestions-area">
            <p>Quick suggestions:</p>
            <div className="suggestions-grid">
              {suggestions.map((sug, idx) => (
                <button key={idx} className="suggestion-btn" onClick={() => handleSuggestionClick(sug)}>
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-area">
          <div className="input-wrapper">
            <label className="file-upload">
              📎
              <input type="file" onChange={handleFileUpload} disabled={loading} accept=".pdf,.jpg,.png,.doc,.docx" />
            </label>
            {uploadedFile && <span className="file-name">{uploadedFile.name}</span>}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about math..."
              disabled={loading}
            />
          </div>
          <button onClick={handleSendMessage} disabled={loading || (!input.trim() && !uploadedFile)}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default AITutor;

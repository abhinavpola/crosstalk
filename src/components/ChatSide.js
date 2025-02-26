import React, { useState, useRef, useEffect } from 'react';

const ChatSide = ({ 
  title, 
  messages, 
  onSendMessage, 
  language,
  isModelSide,
  targetLanguage
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-side">
      <div className="chat-header">
        <h3>{title}</h3>
        <div className="language-indicator">
          {isModelSide ? targetLanguage : 'English'}
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.type === 'user' ? 'user-message' : 'model-message'
            }`}
          >
            <div className="message-content">
              {isModelSide ? msg.translatedContent : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {!isModelSide && (
        <form className="input-area" onSubmit={handleSendMessage}>
          <textarea
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSendMessage(e);
              }
            }}
          />
          <button className="send-button" type="submit">
            →
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatSide;
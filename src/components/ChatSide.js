import React, { useState, useRef, useEffect } from 'react';

const ChatSide = ({ 
  title, 
  messages, 
  onSendMessage, 
  language,
  isModelSide,
  targetLanguage,
  isDirectModel = false
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // Reset height after sending message
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    }
  };

  // Auto-resize textarea as user types
  const handleTextareaChange = (e) => {
    const textarea = e.target;
    setMessage(textarea.value);
    
    // Reset height to get accurate scrollHeight measurement
    textarea.style.height = '40px';
    // Set height based on scrollHeight to accommodate all content
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`chat-side ${isDirectModel ? 'direct-model-side' : ''}`}>
      <div className={`chat-header ${isDirectModel ? 'direct-model-header' : ''}`}>
        <h3>{title}</h3>
        <div className="language-indicator">
          {isModelSide ? targetLanguage : 'English'}
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index}>
            {/* First display thinking bubble if it exists (before the response) */}
            {msg.thinking && msg.type === 'model' && (
              <div className="message model-thinking">
                <div className="thinking-header">Chain of Thought:</div>
                <div className="thinking-content">
                  {isDirectModel 
                    ? msg.thinking 
                    : isModelSide 
                      ? msg.thinking 
                      : msg.translatedThinking || msg.thinking}
                </div>
              </div>
            )}
            
            {/* Then display the main message */}
            <div
              className={`message ${
                msg.type === 'user' ? 'user-message' : 'model-message'
              }`}
            >
              <div className="message-content">
                {isDirectModel
                  ? msg.content
                  : isModelSide 
                    ? msg.translatedContent 
                    : msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {!isModelSide && (
        <form className="input-area" onSubmit={handleSendMessage}>
          <textarea
            ref={textareaRef}
            className="message-input"
            value={message}
            onChange={handleTextareaChange}
            placeholder="Type a message..."
            style={{ minHeight: '40px', maxHeight: '200px', overflow: 'hidden' }}
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
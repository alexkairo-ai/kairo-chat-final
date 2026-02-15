import React from 'react';

function Message({ message, isOwn }) {
  const statusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '✓';
    }
  };

  return (
    <div className={`message ${isOwn ? 'own' : ''}`}>
      <div className="message-content">
        <div className="message-text">{message.text}</div>
        <div className="message-time">
          {new Date(message.createdAt).toLocaleTimeString()}
          {isOwn && <span className="message-status">{statusIcon()}</span>}
        </div>
      </div>
    </div>
  );
}

export default Message;

import React, { useState, useEffect, useRef } from 'react';
import { initSocket, getSocket } from '../utils/socket';
import Message from './Message';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function ChatWindow({ user, token, friend, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = initSocket(token);

    // Загружаем историю сообщений с другом
    fetch(`${SERVER_URL}/api/messages/${friend.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data));

    // Отмечаем как прочитанные
    fetch(`${SERVER_URL}/api/messages/read/${friend.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });

    socket.on('private-message', (msg) => {
      if (msg.senderId === friend.id || msg.receiverId === friend.id) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId === friend.id) {
          socket.emit('message-read', { messageId: msg.id });
        }
      }
    });

    socket.on('message-status', ({ id, status }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    });

    return () => {
      socket.off('private-message');
      socket.off('message-status');
    };
  }, [friend.id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('private-message', { receiverId: friend.id, text: input });
    setInput('');
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>←</button>
        <h2>{friend.username}</h2>
      </div>
      <div className="messages-container">
        {messages.map(msg => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
        />
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
}

export default ChatWindow;

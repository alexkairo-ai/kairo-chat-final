import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initSocket, getSocket } from '../utils/socket';
import Message from './Message';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function ChatWindow({ user, token }) {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [friend, setFriend] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = initSocket(token);

    // Загружаем историю
    fetch(`${SERVER_URL}/api/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data));

    // Получаем информацию о друге
    fetch(`${SERVER_URL}/api/users/search?q=`, { // можно улучшить
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(users => {
        const f = users.find(u => u.id === parseInt(friendId));
        setFriend(f);
      });

    // Отмечаем сообщения как прочитанные
    fetch(`${SERVER_URL}/api/messages/read/${friendId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });

    // Слушаем новые сообщения
    socket.on('private-message', (msg) => {
      if (msg.senderId === parseInt(friendId) || msg.receiverId === parseInt(friendId)) {
        setMessages(prev => [...prev, msg]);
        // Если сообщение от друга, отмечаем как прочитанное
        if (msg.senderId === parseInt(friendId)) {
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
  }, [friendId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('private-message', { receiverId: parseInt(friendId), text: input });
    setInput('');
  };

  if (!friend) return <div>Загрузка...</div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate('/')}>←</button>
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

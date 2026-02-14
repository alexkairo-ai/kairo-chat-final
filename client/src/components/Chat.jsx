import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function Chat({ user, token, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, {
      auth: { token },
    });

    socketRef.current.emit('join', { room });

    socketRef.current.on('history', (msgs) => setMessages(msgs));
    socketRef.current.on('message', (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    socketRef.current.on('user-joined', (msg) =>
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), user: 'Система', text: msg, time: new Date() },
      ])
    );
    socketRef.current.on('user-left', (msg) =>
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), user: 'Система', text: msg, time: new Date() },
      ])
    );

    return () => {
      socketRef.current.disconnect();
    };
  }, [room, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit('message', input);
    setInput('');
  };

  return (
    <div className="chat-area">
      <div className="chat-header">Комната: #{room}</div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`message ${msg.user === user.username ? 'own' : ''}`}
          >
            <div className="user">{msg.user}</div>
            <div className="text">{msg.text}</div>
            <div className="time">
              {new Date(msg.time).toLocaleTimeString()}
            </div>
          </div>
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

export default Chat;

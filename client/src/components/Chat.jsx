import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'https://kairo-chat-final.onrender.com'; // замените на ваш URL от Render

const socket = io(SERVER_URL);

function Chat({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join', { name: user.name, room });

    socket.on('history', setMessages);
    socket.on('message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('user-joined', (msg) => {
      setMessages(prev => [...prev, { id: Date.now(), user: 'Система', text: msg, time: new Date().toISOString() }]);
    });
    socket.on('user-left', (msg) => {
      setMessages(prev => [...prev, { id: Date.now(), user: 'Система', text: msg, time: new Date().toISOString() }]);
    });

    return () => {
      socket.off('history');
      socket.off('message');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [room, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('message', input);
    setInput('');
  };

  return (
    <div>
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px' }}>
        {messages.map((msg, i) => (
          <div key={msg.id || i}>
            <b>{msg.user}:</b> {msg.text} <small>{new Date(msg.time).toLocaleTimeString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        style={{ width: '80%' }}
      />
      <button onClick={sendMessage}>Отправить</button>
    </div>
  );
}

export default Chat;


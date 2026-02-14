import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Login from './components/Login';
import RoomList from './components/RoomList';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentRoom, setCurrentRoom] = useState('general');

  useEffect(() => {
    if (token) {
      fetch('https://kairo-chat-final.onrender.com/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, [token]);

  const handleLogin = (userData, newToken) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>KAIRO</h1>
          <p className="user-greeting">{user.username}</p>
        </div>
        <RoomList currentRoom={currentRoom} onRoomChange={setCurrentRoom} />
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>
      <div className="chat-area">
        <Chat user={user} token={token} room={currentRoom} />
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Login from './components/Login';
import RoomList from './components/RoomList';
import Friends from './components/Friends';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentRoom, setCurrentRoom] = useState('general');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' или 'friends' для мобильной навигации

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
      {/* Верхняя панель с профилем и выходом (только для мобильных) */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <span className="mobile-username">{user.username}</span>
        </div>
        <button className="mobile-logout" onClick={handleLogout}>Выйти</button>
      </div>

      {/* Основной контент */}
      <div className="main-content">
        {/* Десктопная боковая панель (скрыта на мобильных) */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>KAIRO</h1>
            <p className="user-greeting">{user.username}</p>
          </div>
          <RoomList currentRoom={currentRoom} onRoomChange={setCurrentRoom} />
          <Friends token={token} />
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>

        {/* Мобильное содержимое: либо чат, либо друзья */}
        <div className="mobile-content">
          {activeTab === 'chat' ? (
            <Chat user={user} token={token} room={currentRoom} />
          ) : (
            <Friends token={token} />
          )}
        </div>
      </div>

      {/* Нижняя навигация для мобильных */}
      <div className="mobile-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Чат
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Друзья
        </button>
      </div>
    </div>
  );
}

export default App;

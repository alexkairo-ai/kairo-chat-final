import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Login from './components/Login';
import Groups from './components/Groups';
import Friends from './components/Friends';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentGroup, setCurrentGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'friends'

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
      <div className="mobile-header">
        <div className="mobile-header-left">
          <span className="mobile-username">{user.username}</span>
        </div>
        <button className="mobile-logout" onClick={handleLogout}>Выйти</button>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>KAIRO</h1>
            <p className="user-greeting">{user.username}</p>
          </div>
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              Группы
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Друзья
            </button>
          </div>
          {activeTab === 'groups' ? (
            <Groups token={token} onSelectGroup={setCurrentGroup} currentGroup={currentGroup} />
          ) : (
            <Friends token={token} onSelectFriend={(friend) => {
              setCurrentGroup({ type: 'private', friend });
            }} />
          )}
        </div>

        <div className="chat-area">
          {currentGroup ? (
            <Chat user={user} token={token} group={currentGroup} />
          ) : (
            <div className="no-chat-message">Выберите группу или друга для начала общения</div>
          )}
        </div>
      </div>

      <div className="mobile-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          👥 Группы
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👤 Друзья
        </button>
      </div>
    </div>
  );
}

export default App;

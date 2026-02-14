import React, { useState, useEffect } from 'react';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function Friends({ token }) {
  const [tab, setTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (tab === 'friends') fetchFriends();
    if (tab === 'requests') fetchRequests();
  }, [tab, token]);

  const fetchFriends = async () => {
    const res = await fetch(`${SERVER_URL}/api/friends`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setFriends(data);
  };

  const fetchRequests = async () => {
    const res = await fetch(`${SERVER_URL}/api/friends/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setRequests(data);
  };

  const searchUsers = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`${SERVER_URL}/api/users/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSearchResults(data);
  };

  const sendRequest = async (username) => {
    await fetch(`${SERVER_URL}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username })
    });
    alert('Запрос отправлен!');
    setSearchQuery('');
    setSearchResults([]);
  };

  const respondToRequest = async (userId, status) => {
    await fetch(`${SERVER_URL}/api/friends/respond/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    fetchRequests();
    if (status === 'accepted') fetchFriends();
  };

  return (
    <div className="friends-section">
      <div className="friends-tabs">
        <button onClick={() => setTab('friends')} className={tab === 'friends' ? 'active' : ''}>
          Друзья ({friends.length})
        </button>
        <button onClick={() => setTab('requests')} className={tab === 'requests' ? 'active' : ''}>
          Запросы ({requests.length})
        </button>
        <button onClick={() => setTab('search')} className={tab === 'search' ? 'active' : ''}>
          Найти друзей
        </button>
      </div>

      {tab === 'friends' && (
        <div className="friends-list">
          {friends.map(f => (
            <div key={f.id} className="friend-item">
              <span className="friend-name">{f.username}</span>
            </div>
          ))}
          {friends.length === 0 && <p>У вас пока нет друзей</p>}
        </div>
      )}

      {tab === 'requests' && (
        <div className="requests-list">
          {requests.map(r => (
            <div key={r.id} className="request-item">
              <span>{r.username}</span>
              <div className="request-actions">
                <button onClick={() => respondToRequest(r.id, 'accepted')}>✓</button>
                <button onClick={() => respondToRequest(r.id, 'rejected')}>✗</button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p>Нет входящих запросов</p>}
        </div>
      )}

      {tab === 'search' && (
        <div className="search-section">
          <input
            type="text"
            placeholder="Введите никнейм..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
          />
          <div className="search-results">
            {searchResults.map(u => (
              <div key={u.id} className="search-result-item">
                <span>{u.username}</span>
                <button onClick={() => sendRequest(u.username)}>Добавить</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Friends;

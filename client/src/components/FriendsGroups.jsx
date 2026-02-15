import React, { useState, useEffect } from 'react';
import Menu from './Menu';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function FriendsGroups({ user, token, onLogout, onSelectFriend }) {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], groups: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchGroups();
  }, [token]);

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/friends-with-unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults({ users: [], groups: [] });
      return;
    }
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/users/search?q=${query}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${SERVER_URL}/api/groups/search?q=${query}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const users = await usersRes.json();
      const groups = await groupsRes.json();
      setSearchResults({ users, groups });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/user`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="friends-groups-container">
      <div className="top-bar">
        <Menu user={user} onLogout={onLogout} onDeleteAccount={deleteAccount} />
        <div className="search-bar">
          <input
            type="text"
            placeholder="Поиск друзей и групп..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {searchQuery ? (
        <div className="search-results">
          <h3>Пользователи</h3>
          {searchResults.users.map(u => (
            <div key={u.id} className="search-item" onClick={() => onSelectFriend(u)}>
              {u.username}
            </div>
          ))}
          <h3>Группы</h3>
          {searchResults.groups.map(g => (
            <div key={g.id} className="search-item" onClick={() => alert('Групповой чат пока не реализован')}>
              {g.name}
            </div>
          ))}
        </div>
      ) : (
        <div className="lists">
          <div className="friends-list">
            <h2>Друзья</h2>
            {friends.map(f => (
              <div key={f.id} className="friend-item" onClick={() => onSelectFriend(f)}>
                <span>{f.username}</span>
                {f.unreadCount > 0 && <span className="unread-badge">{f.unreadCount}</span>}
              </div>
            ))}
            {friends.length === 0 && <p>У вас пока нет друзей</p>}
          </div>
          <div className="groups-list">
            <h2>Группы</h2>
            {groups.map(g => (
              <div key={g.id} className="group-item" onClick={() => alert('Групповой чат пока не реализован')}>
                {g.name}
              </div>
            ))}
            {groups.length === 0 && <p>Вы не состоите ни в одной группе</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsGroups;

import React, { useState, useEffect } from 'react';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function Groups({ token, onSelectGroup, currentGroup }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [token]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupName, description: groupDesc })
      });
      if (res.ok) {
        setGroupName('');
        setGroupDesc('');
        setShowCreate(false);
        fetchGroups();
      } else {
        const err = await res.json();
        alert(err.error || 'Ошибка создания');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const searchGroups = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`${SERVER_URL}/api/groups/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSearchResults(data);
  };

  const joinGroup = async (groupId) => {
    const res = await fetch(`${SERVER_URL}/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert('Вы присоединились к группе');
      fetchGroups();
    } else {
      const err = await res.json();
      alert(err.error || 'Ошибка');
    }
  };

  return (
    <div className="groups-section">
      <div className="groups-header">
        <button className="create-group-btn" onClick={() => setShowCreate(true)}>
          + Новая группа
        </button>
      </div>

      {showCreate && (
        <form className="create-group-form" onSubmit={createGroup}>
          <input
            type="text"
            placeholder="Название группы"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
          />
          <div className="form-actions">
            <button type="submit">Создать</button>
            <button type="button" onClick={() => setShowCreate(false)}>Отмена</button>
          </div>
        </form>
      )}

      <div className="groups-search">
        <input
          type="text"
          placeholder="Поиск групп..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchGroups(e.target.value);
          }}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(g => (
              <div key={g.id} className="search-result-item">
                <span>{g.name}</span>
                <button onClick={() => joinGroup(g.id)}>Присоединиться</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="groups-list">
        {loading && <p>Загрузка...</p>}
        {groups.map(g => (
          <div
            key={g.id}
            className={`group-item ${currentGroup && currentGroup.type === 'group' && currentGroup.id === g.id ? 'active' : ''}`}
            onClick={() => onSelectGroup({ type: 'group', id: g.id, name: g.name })}
          >
            <div className="group-name">{g.name}</div>
            {g.description && <div className="group-desc">{g.description}</div>}
          </div>
        ))}
        {groups.length === 0 && !loading && <p>Вы не состоите ни в одной группе</p>}
      </div>
    </div>
  );
}

export default Groups;

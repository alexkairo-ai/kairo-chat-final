import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import FriendsGroups from './components/FriendsGroups';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const { user, token, loading, login, logout } = useAuth();
  const [view, setView] = useState('friends'); // 'friends' или 'chat'
  const [selectedFriend, setSelectedFriend] = useState(null); // объект друга для чата

  if (loading) return <div>Загрузка...</div>;

  if (!user) {
    return <Login onLogin={login} />;
  }

  // Переход в чат с другом
  const openChat = (friend) => {
    setSelectedFriend(friend);
    setView('chat');
  };

  // Возврат к списку друзей/групп
  const closeChat = () => {
    setView('friends');
    setSelectedFriend(null);
  };

  return (
    <div className="app">
      {view === 'friends' && (
        <FriendsGroups
          user={user}
          token={token}
          onLogout={logout}
          onSelectFriend={openChat}
        />
      )}
      {view === 'chat' && selectedFriend && (
        <ChatWindow
          user={user}
          token={token}
          friend={selectedFriend}
          onBack={closeChat}
        />
      )}
    </div>
  );
}

export default App;

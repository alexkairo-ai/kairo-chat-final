import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import FriendsGroups from './components/FriendsGroups';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const { user, token, loading, login, logout } = useAuth();

  if (loading) return <div>Загрузка...</div>;

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <BrowserRouter basename="/kairo-chat-final">
      <Routes>
        <Route path="/" element={<FriendsGroups user={user} token={token} onLogout={logout} />} />
        <Route path="/chat/:friendId" element={<ChatWindow user={user} token={token} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

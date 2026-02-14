import React, { useState } from 'react';
import Chat from './components/Chat';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState('general');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>KAIRO Chat</h1>
      <div>
        <label>Комната: </label>
        <select value={room} onChange={(e) => setRoom(e.target.value)}>
          <option value="general">Общий</option>
          <option value="random">Случайный</option>
        </select>
      </div>
      <Chat user={user} room={room} />
    </div>
  );
}

export default App;
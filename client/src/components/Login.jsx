import React, { useState } from 'react';

function Login({ onLogin }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
  e.preventDefault();
  if (name.trim()) {
    localStorage.setItem('chatUserName', name);
    onLogin({ name });
  }
};

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        required
      />
      <button type="submit">Войти</button>
    </form>
  );
}

export default Login;


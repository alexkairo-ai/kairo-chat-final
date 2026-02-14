import React, { useState } from 'react';

const SERVER_URL = 'https://kairo-chat-final.onrender.com';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? `${SERVER_URL}/api/register` : `${SERVER_URL}/api/login`;
    const body = isRegister ? { username, email, password } : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>KAIRO</h1>
        <p className="subtitle">Профессиональный чат</p>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <input
              type="email"
              placeholder="Электронная почта"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="login-btn">
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
        <p className="toggle">
          {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
          <button onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Войти' : 'Создать'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;

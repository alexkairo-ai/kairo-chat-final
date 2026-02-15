import React from 'react';

function Menu({ user, onLogout, onDeleteAccount }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить аккаунт? Все данные будут безвозвратно потеряны.')) {
      onDeleteAccount();
    }
  };

  return (
    <>
      <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      {isOpen && (
        <div className="menu-dropdown">
          <div className="menu-header">Пользователь: {user.username}</div>
          <button onClick={() => alert('Настройки пока в разработке')}>Настройки</button>
          <button onClick={onLogout}>Выйти</button>
          <button onClick={handleDelete} className="danger">Удалить аккаунт</button>
        </div>
      )}
    </>
  );
}

export default Menu;

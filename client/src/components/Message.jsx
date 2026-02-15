import React, { useState, useRef, useEffect } from 'react';

function Message({ message, isOwn, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const menuRef = useRef(null);
  const longPressTimer = useRef(null);
  const isTouch = useRef(false);

  const statusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓'; // можно раскрасить синим
      default: return '✓';
    }
  };

  const handleLongPressStart = (e) => {
    isTouch.current = e.type === 'touchstart';
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm('Удалить сообщение?')) {
      onDelete(message.id);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`message ${isOwn ? 'own' : ''}`}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      {isEditing ? (
        <div className="message-edit">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
          />
          <div className="edit-actions">
            <button onClick={handleSaveEdit}>Сохранить</button>
            <button onClick={handleCancelEdit}>Отмена</button>
          </div>
        </div>
      ) : (
        <>
          <div className="message-content">
            <div className="message-text">{message.text}</div>
            <div className="message-time">
              {new Date(message.createdAt).toLocaleTimeString()}
              {isOwn && <span className="message-status">{statusIcon()}</span>}
            </div>
          </div>
          {showMenu && isOwn && (
            <div className="message-menu" ref={menuRef}>
              <button onClick={handleEdit}>Редактировать</button>
              <button onClick={handleDelete}>Удалить</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Message;

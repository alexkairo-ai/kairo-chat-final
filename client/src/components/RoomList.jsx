import React from 'react';

const rooms = [
  { id: 'general', name: 'Общий' },
  { id: 'random', name: 'Случайный' },
  { id: 'tech', name: 'Технологии' }
];

function RoomList({ currentRoom, onRoomChange }) {
  return (
    <div className="room-list">
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`room-item ${currentRoom === room.id ? 'active' : ''}`}
          onClick={() => onRoomChange(room.id)}
        >
          #{room.name}
        </div>
      ))}
    </div>
  );
}

export default RoomList;

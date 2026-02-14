import React from 'react';

const rooms = ['general', 'random', 'tech'];

function RoomList({ currentRoom, onRoomChange }) {
  return (
    <div className="room-list">
      {rooms.map((room) => (
        <div
          key={room}
          className={`room-item ${currentRoom === room ? 'active' : ''}`}
          onClick={() => onRoomChange(room)}
        >
          #{room}
        </div>
      ))}
    </div>
  );
}

export default RoomList;

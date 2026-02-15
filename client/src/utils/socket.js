import { io } from 'socket.io-client';

const SOCKET_URL = 'https://kairo-chat-final.onrender.com';

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('connect_error', (err) => console.error('Socket error', err));
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

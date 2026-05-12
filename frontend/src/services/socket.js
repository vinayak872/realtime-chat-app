import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socket.emit('user:online', { token });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const getSocket = () => socket;

export const socketEvents = {
  userOnline: 'user:online',
  userStatusChange: 'user:status-change',
  messageSend: 'message:send',
  messageNew: 'message:new',
  messageSent: 'message:sent',
  messageRead: 'message:read',
  messageReadReceipt: 'message:read-receipt',
  typingStart: 'typing:start',
  typingStop: 'typing:stop',
  typingIndicator: 'typing:indicator',
};

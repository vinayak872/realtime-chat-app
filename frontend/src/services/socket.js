import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let savedToken = null;

export const initializeSocket = (token) => {
  if (token) {
    savedToken = token;
  }

  // Singleton: if socket instance already exists, do NOT recreate or disconnect!
  if (socket) {
    if (socket.connected && savedToken) {
      socket.emit('user:online', { token: savedToken });
    }
    return socket;
  }

  console.log('[Socket] Initializing connection to:', SOCKET_URL);

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected successfully, id:', socket.id);
    if (savedToken) {
      socket.emit('user:online', { token: savedToken });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  savedToken = null;
};

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
  // Call events
  callInitiate: 'call:initiate',
  callIncoming: 'call:incoming',
  callRinging: 'call:ringing',
  callAccept: 'call:accept',
  callAccepted: 'call:accepted',
  callStarted: 'call:started',
  callReject: 'call:reject',
  callRejected: 'call:rejected',
  callSignal: 'call:signal',
  callMediaState: 'call:media-state',
  callEnd: 'call:end',
  callEnded: 'call:ended',
  callBusy: 'call:busy',
  callUnavailable: 'call:unavailable',
  callError: 'call:error',
};

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  getAllUsers: () => api.get('/auth/users'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const chatService = {
  createChat: (data) => api.post('/chats', data),
  getUserChats: () => api.get('/chats'),
  getChatMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  getUnreadCount: () => api.get('/chats/unread/count'),
};

export const messageService = {
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  markChatAsRead: (chatId) => api.put(`/messages/chat/${chatId}/read-all`),
  uploadFile: (formData) => api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;

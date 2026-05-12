import React, { createContext, useState, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const markMessageAsRead = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  }, []);

  const addTypingUser = useCallback((chatId, userId) => {
    setTypingUsers((prev) => new Set([...prev, `${chatId}:${userId}`]));
  }, []);

  const removeTypingUser = useCallback((chatId, userId) => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(`${chatId}:${userId}`);
      return newSet;
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        currentChat,
        setCurrentChat,
        messages,
        setMessages,
        users,
        setUsers,
        loading,
        setLoading,
        onlineUsers,
        setOnlineUsers,
        typingUsers,
        addTypingUser,
        removeTypingUser,
        addMessage,
        markMessageAsRead,
        unreadCounts,
        setUnreadCounts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

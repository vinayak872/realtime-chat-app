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
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('chat_sound_enabled') !== 'false';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('chat_sound_enabled', String(next));
      return next;
    });
  }, []);

  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const markMessageAsRead = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  }, []);

  const updateMessageReactions = useCallback((messageId, reactions) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, reactions } : msg
      )
    );
  }, []);

  const updateMessageContent = useCallback((messageId, content, isEdited = true) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content, isEdited } : msg
      )
    );
  }, []);

  const deleteMessageById = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isDeleted: true,
              content: '🚫 This message was deleted',
              fileUrl: null,
              fileType: null,
              fileName: null,
            }
          : msg
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
        updateMessageReactions,
        updateMessageContent,
        deleteMessageById,
        unreadCounts,
        setUnreadCounts,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        soundEnabled,
        toggleSound,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

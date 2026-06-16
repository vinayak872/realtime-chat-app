import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { chatService, authService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';

const ChatList = () => {
  const { chats, setChats, currentChat, setCurrentChat, unreadCounts, setUnreadCounts } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await authService.getAllUsers();
        setAllUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (showUserList) {
      fetchAllUsers();
    }
  }, [showUserList]);

  // Listen for new messages to update the chat list sorting and unread counts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c.id === message.chatId);
        if (chatIndex > -1) {
          const updatedChat = { ...prevChats[chatIndex], lastMessage: message };
          const newChats = [...prevChats];
          newChats.splice(chatIndex, 1);
          return [updatedChat, ...newChats]; // Move chat to the top
        }
        return prevChats;
      });

      // Increment unread count if the chat is not currently open
      if (currentChat?.id !== message.chatId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.chatId]: (prev[message.chatId] || 0) + 1,
        }));
      }
    };

    socket.on(socketEvents.messageNew, handleNewMessage);
    return () => {
      socket.off(socketEvents.messageNew, handleNewMessage);
    };
  }, [currentChat?.id, setChats, setUnreadCounts]);

  const handleStartChat = async (user2Id) => {
    try {
      const response = await chatService.createChat({ user2Id });
      const newChat = {
        id: response.data.chat.id,
        otherUser: allUsers.find((u) => u.id === user2Id),
        lastMessage: null,
      };
      setChats((prev) => {
        const existing = prev.find((c) => c.id === newChat.id);
        if (existing) return prev;
        return [newChat, ...prev];
      });
      setCurrentChat(newChat);
      setShowUserList(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Sort chats by latest message timestamp, then filter by search term
  const sortedChats = [...chats].sort((a, b) => {
    const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
    const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
    return dateB - dateA;
  });

  const filteredChats = sortedChats.filter((chat) =>
    chat.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`bg-white border-r border-gray-200 flex-col h-full shrink-0 ${currentChat ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80'}`}>
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200 bg-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="text-gray-600 hover:text-primary rounded-full p-1 transition"
            title="Profile menu"
          >
            ⋮
          </button>
        </div>

        {/* Profile Menu Dropdown */}
        {showProfileMenu && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-md z-10">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-light text-red-600 font-semibold rounded transition text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-primary">Chats</h1>
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="text-primary hover:bg-light rounded-full p-2 transition"
            title="Start new chat"
          >
            ✏️
          </button>
        </div>
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:border-primary text-sm"
        />
      </div>

      {/* User List */}
      {showUserList && (
        <div className="border-b border-gray-200 max-h-60 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-sm font-semibold text-gray-600 px-2 py-2">Contacts</h3>
            {allUsers.length > 0 ? (
              allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u.id)}
                  className="w-full text-left px-3 py-2 hover:bg-light rounded transition flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.username}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">No users available</p>
            )}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const unreadCount = unreadCounts[chat.id] || 0;
            const isUnread = unreadCount > 0;
            const isSelected = currentChat?.id === chat.id;

            return (
            <button
              key={chat.id}
              onClick={() => {
                setCurrentChat(chat);
                setUnreadCounts((prev) => ({ ...prev, [chat.id]: 0 }));
              }}
              className={`w-full p-3 border-b border-gray-100 transition text-left flex items-center ${
                isSelected ? 'bg-light' : isUnread ? 'bg-green-50' : 'hover:bg-light'
              }`}
            >
              <div className="flex gap-3 w-full">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {chat.otherUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {chat.otherUser.username}
                    </p>
                    <span className={`text-xs flex-shrink-0 ml-2 ${isUnread ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                      {chat.lastMessage && new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                      {chat.lastMessage?.content || (chat.lastMessage?.fileUrl ? '📎 File attached' : 'No messages yet')}
                    </p>
                    {isUnread && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )})
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No chats yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;

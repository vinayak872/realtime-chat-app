import React, { useContext, useState, useEffect } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { chatService, authService } from '../services/api';

const ChatList = () => {
  const { chats, setChats, currentChat, setCurrentChat } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

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

  const filteredChats = chats.filter((chat) =>
    chat.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
          className="w-full px-3 py-2 bg-light rounded-full focus:outline-none text-sm"
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
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChat(chat)}
              className={`w-full p-3 border-b border-gray-100 hover:bg-light transition text-left ${
                currentChat?.id === chat.id ? 'bg-light' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {chat.otherUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{chat.otherUser.username}</p>
                    <span className="text-xs text-gray-400">
                      {chat.lastMessage && new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          ))
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

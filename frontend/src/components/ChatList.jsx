import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { chatService, authService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';
import {
  Search,
  LogOut,
  Users,
  MessageSquare,
  CheckCheck,
  Check,
  X,
  Phone,
  Video,
  Mic,
} from 'lucide-react';

const formatChatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffInHours < 48) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ChatList = () => {
  const { chats, setChats, currentChat, setCurrentChat, unreadCounts, setUnreadCounts } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'users'
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

    fetchAllUsers();
  }, []);

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
          return [updatedChat, ...newChats];
        }
        return prevChats;
      });

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
      setActiveTab('chats');
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

  // Sort chats by latest message timestamp
  const sortedChats = [...chats].sort((a, b) => {
    const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
    const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
    return dateB - dateA;
  });

  const filteredChats = sortedChats.filter((chat) =>
    chat.otherUser?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const otherUsers = allUsers.filter((u) => u.id !== user?.id);
  const onlineContacts = otherUsers.filter((u) => u.status === 'online');

  const filteredUsers = otherUsers.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnreads = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  return (
    <div className="flex flex-col h-full w-full bg-[#0F172A] text-slate-100 select-none overflow-hidden">
      {/* Phone App Bar Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0F172A]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* User Avatar with status */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/10">
                <div className="w-full h-full rounded-[14px] bg-[#0B0F19] text-white font-bold flex items-center justify-center text-base">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                  ) : (
                    user?.username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
            </div>

            <div>
              <h1 className="font-bold text-lg text-white leading-tight">{user?.username}</h1>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Now
              </p>
            </div>
          </div>

          {/* Action Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Menu"
            >
              <LogOut className="w-5 h-5 text-rose-400" />
            </button>

            {/* Logout Dropdown Confirmation */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-2 z-50 animate-slide-up">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === 'chats' ? 'Search messages or people...' : 'Search all contacts...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Active / Online Users Story Carousel */}
      {onlineContacts.length > 0 && (
        <div className="py-3 px-4 border-b border-white/5 bg-[#0B0F19]/50 shrink-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active Friends ({onlineContacts.length})
          </p>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {onlineContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleStartChat(contact.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className="relative">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 group-hover:scale-105 transition-transform duration-200">
                    <div className="w-12 h-12 rounded-[14px] bg-[#0F172A] text-white font-bold flex items-center justify-center text-sm">
                      {contact.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19] ring-1 ring-emerald-400" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white max-w-[60px] truncate text-center">
                  {contact.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modern Tab Switcher */}
      <div className="px-4 pt-3 pb-1 shrink-0 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'chats'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chats</span>
          {totalUnreads > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-emerald-700 font-bold">
              {totalUnreads}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Users</span>
          <span className="text-[10px] opacity-70">({otherUsers.length})</span>
        </button>
      </div>

      {/* Main List Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {activeTab === 'chats' ? (
          /* Recent Chats Tab */
          filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">No conversations found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                {searchTerm ? 'Try a different search term' : 'Switch to the "All Users" tab to start your first conversation!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setActiveTab('users')}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition"
                >
                  Browse Users
                </button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = currentChat?.id === chat.id;
              const unread = unreadCounts[chat.id] || 0;
              const lastMsg = chat.lastMessage;
              const isLastMsgMe = lastMsg && lastMsg.senderId === user?.id;

              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setCurrentChat(chat);
                    setUnreadCounts((prev) => ({ ...prev, [chat.id]: 0 }));
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'hover:bg-white/5 active:bg-white/10'
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-sm">
                      <div className="w-full h-full rounded-[14px] bg-[#0B0F19] text-white font-bold flex items-center justify-center text-base">
                        {chat.otherUser?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    {chat.otherUser?.status === 'online' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm text-white truncate">
                        {chat.otherUser?.username}
                      </h3>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                        {formatChatTime(lastMsg?.createdAt || chat.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        {isLastMsgMe && (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        {lastMsg?.fileType === 'audio' ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Mic className="w-3 h-3 text-emerald-400" /> Voice message
                          </span>
                        ) : lastMsg?.fileType?.startsWith('call') ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-cyan-400" /> {lastMsg.content}
                          </span>
                        ) : (
                          lastMsg?.content || lastMsg?.fileName || 'No messages yet'
                        )}
                      </p>

                      {unread > 0 && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[11px] shadow-sm">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          /* All Users Directory Tab */
          filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
              <Users className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm font-medium">No users found</p>
            </div>
          ) : (
            filteredUsers.map((item) => (
              <button
                key={item.id}
                onClick={() => handleStartChat(item.id)}
                className="w-full p-3 rounded-2xl flex items-center justify-between text-left hover:bg-white/5 active:bg-white/10 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-sm">
                      <div className="w-full h-full rounded-[14px] bg-[#0B0F19] text-white font-bold flex items-center justify-center text-sm">
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    {item.status === 'online' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-white truncate">{item.username}</h4>
                    <p className="text-xs text-slate-400 truncate">
                      {item.status === 'online' ? (
                        <span className="text-emerald-400">Online</span>
                      ) : (
                        item.email
                      )}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition">
                  Chat
                </span>
              </button>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ChatList;

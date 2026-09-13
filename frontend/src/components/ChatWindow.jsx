import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { CallContext } from '../context/CallContext';
import { chatService, messageService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';
import {
  playIncomingMessageSound,
  requestNotificationPermission,
  showDesktopNotification,
} from '../utils/chatSounds';
import {
  Phone,
  Video,
  ChevronLeft,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = () => {
  const {
    currentChat,
    setCurrentChat,
    messages,
    setMessages,
    addMessage,
    markMessageAsRead,
    setUnreadCounts,
    updateMessageReactions,
    updateMessageContent,
    deleteMessageById,
    soundEnabled,
    toggleSound,
    searchQuery,
    setSearchQuery,
  } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const { startCall, callStatus } = useContext(CallContext);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);

  // Request browser notification permission once on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch initial chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;

      setLoading(true);
      try {
        const response = await chatService.getChatMessages(currentChat.id);
        setMessages(response.data.messages);

        // Clear unread counts for this chat
        setUnreadCounts((prev) => ({ ...prev, [currentChat.id]: 0 }));

        // Mark all as read
        await messageService.markChatAsRead(currentChat.id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    setSearchQuery('');
    setShowSearch(false);
  }, [currentChat?.id, setMessages, setUnreadCounts, setSearchQuery]);

  // Socket event subscriptions
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.chatId === currentChat?.id) {
        addMessage(message);

        // Play chime & show notification if message from other user
        if (message.senderId !== user?.id) {
          if (soundEnabled) {
            playIncomingMessageSound();
          }
          if (document.hidden) {
            showDesktopNotification({
              title: currentChat?.otherUser?.username || 'New message',
              body:
                message.content ||
                (message.fileName ? `📎 File: ${message.fileName}` : 'Voice note received'),
            });
          }
        }
      }
    };

    const handleReadReceipt = (data) => {
      if (data.chatId === currentChat?.id) {
        markMessageAsRead(data.messageId);
      }
    };

    const handleReactionUpdated = (data) => {
      if (data.chatId === currentChat?.id) {
        updateMessageReactions(data.messageId, data.reactions);
      }
    };

    const handleMessageEdited = (data) => {
      if (data.chatId === currentChat?.id) {
        updateMessageContent(data.messageId, data.content, true);
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.chatId === currentChat?.id) {
        deleteMessageById(data.messageId);
      }
    };

    socket.on(socketEvents.messageNew, handleNewMessage);
    socket.on(socketEvents.messageReadReceipt, handleReadReceipt);
    socket.on(socketEvents.messageReactionUpdated, handleReactionUpdated);
    socket.on(socketEvents.messageEdited, handleMessageEdited);
    socket.on(socketEvents.messageDeleted, handleMessageDeleted);

    return () => {
      socket.off(socketEvents.messageNew, handleNewMessage);
      socket.off(socketEvents.messageReadReceipt, handleReadReceipt);
      socket.off(socketEvents.messageReactionUpdated, handleReactionUpdated);
      socket.off(socketEvents.messageEdited, handleMessageEdited);
      socket.off(socketEvents.messageDeleted, handleMessageDeleted);
    };
  }, [
    currentChat?.id,
    currentChat?.otherUser?.username,
    user?.id,
    soundEnabled,
    addMessage,
    markMessageAsRead,
    updateMessageReactions,
    updateMessageContent,
    deleteMessageById,
  ]);

  // Scroll to bottom on new messages if not currently searching
  useEffect(() => {
    if (!searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, searchQuery]);

  // Filter messages for search
  const matchedMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => !m.isDeleted && m.content && m.content.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
    if (matchedMessageIds.length > 0) {
      scrollToMatch(matchedMessageIds[0]);
    }
  }, [matchedMessageIds]);

  const scrollToMatch = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 1500);
    }
  };

  const handleNextMatch = () => {
    if (matchedMessageIds.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedMessageIds.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(matchedMessageIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchedMessageIds.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedMessageIds.length) % matchedMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(matchedMessageIds[prevIdx]);
  };

  const handleToggleSearch = () => {
    setShowSearch((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery('');
      } else {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      return next;
    });
  };

  if (!currentChat) {
    return null;
  }

  const handleStartAudioCall = () => {
    if (!currentChat?.otherUser) return;
    startCall({
      targetUser: currentChat.otherUser,
      callType: 'audio',
      chatId: currentChat.id,
    });
  };

  const handleStartVideoCall = () => {
    if (!currentChat?.otherUser) return;
    startCall({
      targetUser: currentChat.otherUser,
      callType: 'video',
      chatId: currentChat.id,
    });
  };

  const isCallDisabled = callStatus !== 'idle';
  const isOnline = currentChat.otherUser?.status === 'online';

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] text-slate-100 h-full w-full max-w-full overflow-hidden relative">
      {/* Sticky Native Phone & Desktop Header */}
      <div className="p-3 sm:p-4 border-b border-white/10 bg-[#0F172A]/95 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Back to Chats Button */}
          <button
            onClick={() => setCurrentChat(null)}
            className="lg:hidden p-2 -ml-1 text-slate-300 hover:text-white active:scale-95 rounded-xl hover:bg-white/10 transition"
            title="Back to chats"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Contact Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-[14px] bg-[#0B0F19] text-white font-bold flex items-center justify-center text-sm sm:text-base">
                {currentChat.otherUser?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
            )}
          </div>

          {/* Contact Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-sm sm:text-base text-white truncate leading-tight">
                {currentChat.otherUser?.username}
              </h2>
            </div>
            <p className="text-xs truncate">
              {isOnline ? (
                <span className="text-emerald-400 font-medium">● Active now</span>
              ) : currentChat.otherUser?.lastSeen ? (
                <span className="text-slate-400">
                  Last seen{' '}
                  {new Date(currentChat.otherUser.lastSeen).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : (
                <span className="text-slate-500">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons: Sound, Search, Audio Call, Video Call */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sound Notification Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl transition-all duration-150 active:scale-95 ${
              soundEnabled
                ? 'text-emerald-400 hover:bg-emerald-500/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
            title={soundEnabled ? 'Mute notification sounds' : 'Unmute notification sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>

          {/* Search Toggle */}
          <button
            onClick={handleToggleSearch}
            className={`p-2 rounded-xl transition-all duration-150 active:scale-95 ${
              showSearch
                ? 'text-cyan-400 bg-cyan-500/15'
                : 'text-slate-300 hover:text-cyan-400 hover:bg-white/5'
            }`}
            title="Search messages"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Voice Call */}
          <button
            onClick={handleStartAudioCall}
            disabled={isCallDisabled}
            className={`p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isCallDisabled
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95'
            }`}
            title="Voice Call"
          >
            <Phone className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          {/* Video Call */}
          <button
            onClick={handleStartVideoCall}
            disabled={isCallDisabled}
            className={`p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isCallDisabled
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 active:scale-95'
            }`}
            title="Video Call"
          >
            <Video className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Expandable In-Chat Search Bar */}
      {showSearch && (
        <div className="px-4 py-2.5 bg-slate-900/95 border-b border-white/10 flex items-center gap-2 z-10 animate-slide-down">
          <div className="flex-1 flex items-center gap-2 bg-[#0B0F19] rounded-xl px-3 py-1.5 border border-white/10 focus-within:border-cyan-500/50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this conversation..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <span>
                {matchedMessageIds.length === 0
                  ? 'No results'
                  : `${currentMatchIndex + 1} of ${matchedMessageIds.length}`}
              </span>
              <button
                onClick={handlePrevMatch}
                disabled={matchedMessageIds.length === 0}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded disabled:opacity-40"
                title="Previous match"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMatch}
                disabled={matchedMessageIds.length === 0}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded disabled:opacity-40"
                title="Next match"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleToggleSearch}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            title="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Canvas Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-[#0B0F19] to-[#0B0F19]">
        <MessageList ref={messagesEndRef} loading={loading} />
      </div>

      {/* Modern Phone Bottom Input Bar */}
      <div className="shrink-0 z-20">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;

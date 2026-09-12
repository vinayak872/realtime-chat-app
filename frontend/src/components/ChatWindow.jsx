import React, { useContext, useEffect, useState, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { CallContext } from '../context/CallContext';
import { chatService, messageService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';
import { Phone, Video, ChevronLeft, Shield } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = () => {
  const { currentChat, setCurrentChat, messages, setMessages, addMessage, markMessageAsRead, setUnreadCounts } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const { startCall, callStatus } = useContext(CallContext);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
  }, [currentChat?.id, setMessages, setUnreadCounts]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(socketEvents.messageNew, (message) => {
      if (message.chatId === currentChat?.id) {
        addMessage(message);
      }
    });

    socket.on(socketEvents.messageReadReceipt, (data) => {
      if (data.chatId === currentChat?.id) {
        markMessageAsRead(data.messageId);
      }
    });

    return () => {
      socket.off(socketEvents.messageNew);
      socket.off(socketEvents.messageReadReceipt);
    };
  }, [currentChat?.id, addMessage, markMessageAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                  Last seen {new Date(currentChat.otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-slate-500">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Call Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleStartAudioCall}
            disabled={isCallDisabled}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isCallDisabled
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95'
            }`}
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            onClick={handleStartVideoCall}
            disabled={isCallDisabled}
            className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isCallDisabled
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 active:scale-95'
            }`}
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>

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

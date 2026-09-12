import React, { useContext, useEffect, useState, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { CallContext } from '../context/CallContext';
import { chatService, messageService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';
import { Phone, Video } from 'lucide-react';
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
        
        // Clear unread counts for this chat when opened
        setUnreadCounts(prev => ({ ...prev, [currentChat.id]: 0 }));

        // Mark all as read
        await messageService.markChatAsRead(currentChat.id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentChat?.id]);

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
  }, [currentChat?.id]);

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

  return (
    <div className="flex-1 flex flex-col bg-white h-full w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentChat(null)}
            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Back to chats"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold shadow-inner">
            {currentChat.otherUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{currentChat.otherUser.username}</p>
            <p className="text-xs text-gray-500">
              {currentChat.otherUser.status === 'online' ? (
                <span className="text-emerald-600 font-medium">● Online</span>
              ) : (
                `Last seen at ${new Date(currentChat.otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              )}
            </p>
          </div>
        </div>

        {/* Call Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleStartAudioCall}
            disabled={isCallDisabled}
            className={`p-2.5 rounded-full transition duration-150 flex items-center justify-center ${
              isCallDisabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-primary hover:bg-primary/10 hover:text-primary active:scale-95'
            }`}
            title="Start voice call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            onClick={handleStartVideoCall}
            disabled={isCallDisabled}
            className={`p-2.5 rounded-full transition duration-150 flex items-center justify-center ${
              isCallDisabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-primary hover:bg-primary/10 hover:text-primary active:scale-95'
            }`}
            title="Start video call"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList ref={messagesEndRef} loading={loading} />

      {/* Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;

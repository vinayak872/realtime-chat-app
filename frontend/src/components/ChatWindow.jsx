import React, { useContext, useEffect, useState, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { chatService, messageService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = () => {
  const { currentChat, messages, setMessages, addMessage, markMessageAsRead } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;

      setLoading(true);
      try {
        const response = await chatService.getChatMessages(currentChat.id);
        setMessages(response.data.messages);

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

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            {currentChat.otherUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{currentChat.otherUser.username}</p>
            <p className="text-xs text-gray-500">
              {currentChat.otherUser.status === 'online' ? '🟢 Online' : `Last seen at ${new Date(currentChat.otherUser.lastSeen).toLocaleTimeString()}`}
            </p>
          </div>
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

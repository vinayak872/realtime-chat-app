import React, { useContext, forwardRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const MessageList = forwardRef(({ loading }, ref) => {
  const { messages } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const { typingUsers } = useContext(ChatContext);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-list">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === user.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.fileUrl ? (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline block"
                >
                  📎 {message.fileName || 'Download file'}
                </a>
              ) : (
                <p className="break-words text-sm">{message.content}</p>
              )}
              <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                message.senderId === user.id ? 'text-green-100' : 'text-gray-500'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.senderId === user.id && message.isRead && ' ✓✓'}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={ref} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;

import React, { useContext, forwardRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import VoiceMessage from './VoiceMessage';
import { PhoneCall, PhoneMissed, PhoneOff, Video } from 'lucide-react';

const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${url}`;
};

const CallMessageCard = ({ message, isMe }) => {
  const isMissed = message.fileType === 'call_missed';
  const isDeclined = message.fileType === 'call_declined';
  const isVideo = message.content?.toLowerCase().includes('video');

  return (
    <div className="flex items-center gap-3 py-1">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isMissed || isDeclined
            ? 'bg-rose-500/20 text-rose-500'
            : isMe
            ? 'bg-white/20 text-white'
            : 'bg-primary/20 text-primary'
        }`}
      >
        {isMissed ? (
          <PhoneMissed className="w-4 h-4" />
        ) : isDeclined ? (
          <PhoneOff className="w-4 h-4" />
        ) : isVideo ? (
          <Video className="w-4 h-4" />
        ) : (
          <PhoneCall className="w-4 h-4" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{message.content}</p>
        <span
          className={`text-[11px] ${
            isMe ? 'text-green-100' : 'text-gray-500'
          }`}
        >
          {isMissed ? 'No answer' : isDeclined ? 'Declined' : 'Call ended'}
        </span>
      </div>
    </div>
  );
};

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
        messages.map((message) => {
          const isCall =
            message.fileType === 'call_ended' ||
            message.fileType === 'call_missed' ||
            message.fileType === 'call_declined';

          return (
            <div
              key={message.id}
              className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md px-3 md:px-4 py-2 rounded-xl shadow-sm ${
                  message.senderId === user.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {isCall ? (
                  <CallMessageCard message={message} isMe={message.senderId === user.id} />
                ) : message.fileType === 'audio' ? (
                  <VoiceMessage fileUrl={message.fileUrl} />
                ) : message.fileUrl ? (
                  <a
                    href={getFullUrl(message.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline block"
                  >
                    📎 {message.fileName || 'Download file'}
                  </a>
                ) : (
                  <p className="break-words text-sm">{message.content}</p>
                )}
                <div
                  className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                    message.senderId === user.id ? 'text-green-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.senderId === user.id && message.isRead && ' ✓✓'}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={ref} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;

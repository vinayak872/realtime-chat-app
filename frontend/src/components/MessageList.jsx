import React, { useContext, forwardRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import VoiceMessage from './VoiceMessage';
import { PhoneCall, PhoneMissed, PhoneOff, Video, CheckCheck, Check, Paperclip, MessageSquare } from 'lucide-react';

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
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isMissed || isDeclined
            ? 'bg-rose-500/20 text-rose-400'
            : isMe
            ? 'bg-white/20 text-white'
            : 'bg-emerald-500/20 text-emerald-400'
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
        <span className={`text-[11px] ${isMe ? 'text-emerald-100/70' : 'text-slate-400'}`}>
          {isMissed ? 'Missed call' : isDeclined ? 'Declined' : 'Call ended'}
        </span>
      </div>
    </div>
  );
};

const MessageList = forwardRef(({ loading }, ref) => {
  const { messages, currentChat } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-2" />
        <p className="text-xs">Loading message history...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 messages-list">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-2xl">
            👋
          </div>
          <h4 className="text-base font-semibold text-white mb-1">
            Say hello to {currentChat?.otherUser?.username}!
          </h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Start the conversation with a message, voice note, or high-definition call.
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isMe = message.senderId === user?.id;
          const isCall =
            message.fileType === 'call_ended' ||
            message.fileType === 'call_missed' ||
            message.fileType === 'call_declined';

          return (
            <div
              key={message.id}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-md px-4 py-2.5 shadow-md ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-2xl rounded-br-xs shadow-emerald-950/20'
                    : 'bg-[#1E293B] text-slate-100 rounded-2xl rounded-bl-xs border border-white/5'
                }`}
              >
                {isCall ? (
                  <CallMessageCard message={message} isMe={isMe} />
                ) : message.fileType === 'audio' ? (
                  <VoiceMessage fileUrl={message.fileUrl} />
                ) : message.fileUrl ? (
                  <a
                    href={getFullUrl(message.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 hover:underline py-1 text-sm font-medium"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate">{message.fileName || 'Download attachment'}</span>
                  </a>
                ) : (
                  <p className="break-words text-sm sm:text-base leading-relaxed">{message.content}</p>
                )}

                {/* Message Timestamp and Read Receipt */}
                <div
                  className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-medium select-none ${
                    isMe ? 'text-emerald-100/70' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && (
                    message.isRead ? (
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-200" title="Read" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-200/80" title="Sent" />
                    )
                  )}
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

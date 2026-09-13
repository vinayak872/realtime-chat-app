import React, { useContext, forwardRef, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { getSocket, socketEvents } from '../services/socket';
import VoiceMessage from './VoiceMessage';
import {
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Video,
  CheckCheck,
  Check,
  Paperclip,
  Reply,
  Pencil,
  Trash2,
  Smile,
  Ban,
  CornerDownRight,
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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

const QuotedMessage = ({ replyTo, onScrollTo }) => {
  if (!replyTo) return null;

  let parsed = replyTo;
  if (typeof replyTo === 'string') {
    try {
      parsed = JSON.parse(replyTo);
    } catch (e) {
      return null;
    }
  }

  if (!parsed || !parsed.id) return null;

  return (
    <div
      onClick={() => onScrollTo(parsed.id)}
      className="mb-1.5 p-2 rounded-xl bg-black/25 hover:bg-black/40 border-l-3 border-emerald-400 cursor-pointer transition text-left flex items-start gap-2"
    >
      <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-emerald-300 truncate">
          {parsed.senderName || 'Message'}
        </p>
        <p className="text-xs text-slate-200/90 truncate">
          {parsed.content || (parsed.fileName ? `📎 ${parsed.fileName}` : 'Voice note')}
        </p>
      </div>
    </div>
  );
};

const MessageList = forwardRef(({ loading }, ref) => {
  const {
    messages,
    currentChat,
    setReplyingTo,
    setEditingMessage,
    searchQuery,
  } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [activePickerId, setActivePickerId] = useState(null);

  const handleToggleReaction = (messageId, emoji) => {
    const socket = getSocket();
    if (!socket || !currentChat) return;

    socket.emit(socketEvents.messageReaction, {
      messageId,
      chatId: currentChat.id,
      emoji,
    });
    setActivePickerId(null);
  };

  const handleDeleteMessage = (messageId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    const socket = getSocket();
    if (!socket || !currentChat) return;

    socket.emit(socketEvents.messageDelete, {
      messageId,
      chatId: currentChat.id,
    });
  };

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-[#0B0F19]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-[#0B0F19]');
      }, 2000);
    }
  };

  const renderContentWithHighlights = (content, query) => {
    if (!query || !query.trim() || !content) return content;

    const parts = content.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-slate-950 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

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
          const isDeleted = Boolean(message.isDeleted);

          // Parse reactions
          let reactionsList = [];
          if (message.reactions) {
            try {
              reactionsList = typeof message.reactions === 'string'
                ? JSON.parse(message.reactions)
                : message.reactions;
            } catch (e) {
              reactionsList = [];
            }
          }

          // Aggregate reactions by emoji
          const reactionsByEmoji = {};
          reactionsList.forEach((r) => {
            if (!reactionsByEmoji[r.emoji]) {
              reactionsByEmoji[r.emoji] = { count: 0, hasMine: false, users: [] };
            }
            reactionsByEmoji[r.emoji].count += 1;
            reactionsByEmoji[r.emoji].users.push(r.username);
            if (r.userId === user?.id) {
              reactionsByEmoji[r.emoji].hasMine = true;
            }
          });

          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={`group relative flex w-full ${isMe ? 'justify-end' : 'justify-start'} transition-all`}
            >
              <div className="relative max-w-[85%] sm:max-w-md">
                {/* Floating Quick Action Toolbar */}
                {!isCall && !isDeleted && (
                  <div
                    className={`absolute -top-3.5 z-20 hidden group-hover:flex items-center gap-1 bg-[#1E293B]/95 border border-white/15 backdrop-blur-md rounded-full px-1.5 py-0.5 shadow-xl transition-all ${
                      isMe ? 'right-2' : 'left-2'
                    }`}
                  >
                    {/* Reaction trigger */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActivePickerId(activePickerId === message.id ? null : message.id)
                        }
                        className="p-1 text-slate-300 hover:text-amber-400 rounded-full hover:bg-white/10 transition active:scale-95"
                        title="React"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {/* Emoji Picker Flyout */}
                      {activePickerId === message.id && (
                        <div className="absolute bottom-full mb-1 left-0 flex items-center gap-1 bg-slate-900 border border-white/20 p-1 rounded-2xl shadow-2xl z-30 animate-scale-in">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(message.id, emoji)}
                              className="text-base p-1 hover:scale-125 transition active:scale-95"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reply Button */}
                    <button
                      onClick={() =>
                        setReplyingTo({
                          id: message.id,
                          senderName: isMe ? 'You' : currentChat?.otherUser?.username,
                          content: message.content,
                          fileName: message.fileName,
                          fileType: message.fileType,
                        })
                      }
                      className="p-1 text-slate-300 hover:text-cyan-400 rounded-full hover:bg-white/10 transition active:scale-95"
                      title="Reply"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit & Delete for sender */}
                    {isMe && !message.fileUrl && (
                      <button
                        onClick={() =>
                          setEditingMessage({
                            id: message.id,
                            content: message.content,
                          })
                        }
                        className="p-1 text-slate-300 hover:text-emerald-400 rounded-full hover:bg-white/10 transition active:scale-95"
                        title="Edit message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 text-slate-300 hover:text-rose-400 rounded-full hover:bg-white/10 transition active:scale-95"
                        title="Delete for everyone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Message Bubble Card */}
                <div
                  className={`relative px-4 py-2.5 shadow-md ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-2xl rounded-br-xs shadow-emerald-950/20'
                      : 'bg-[#1E293B] text-slate-100 rounded-2xl rounded-bl-xs border border-white/5'
                  } ${isDeleted ? 'opacity-75 italic' : ''}`}
                >
                  {/* Quoted Message Preview if replying to an earlier message */}
                  {message.replyTo && !isDeleted && (
                    <QuotedMessage replyTo={message.replyTo} onScrollTo={handleScrollToMessage} />
                  )}

                  {/* Message Content */}
                  {isDeleted ? (
                    <div className="flex items-center gap-1.5 py-1 text-slate-300 text-xs sm:text-sm">
                      <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>This message was deleted</span>
                    </div>
                  ) : isCall ? (
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
                    <p className="break-words text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {renderContentWithHighlights(message.content, searchQuery)}
                    </p>
                  )}

                  {/* Message Metadata (Timestamp, Edited tag, Read Receipts) */}
                  <div
                    className={`text-[10px] mt-1 flex items-center justify-end gap-1.5 font-medium select-none ${
                      isMe ? 'text-emerald-100/70' : 'text-slate-400'
                    }`}
                  >
                    {message.isEdited && !isDeleted && (
                      <span className="italic text-[9px] opacity-80">(edited)</span>
                    )}
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && !isDeleted && (
                      message.isRead ? (
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-200" title="Read" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-200/80" title="Sent" />
                      )
                    )}
                  </div>
                </div>

                {/* Reaction Pills Below Bubble */}
                {Object.keys(reactionsByEmoji).length > 0 && !isDeleted && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(reactionsByEmoji).map(([emoji, data]) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(message.id, emoji)}
                        title={data.users.join(', ')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                          data.hasMine
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-semibold">{data.count}</span>
                      </button>
                    ))}
                  </div>
                )}
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

import React, { useContext, useState, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { messageService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';
import VoiceRecorder from './VoiceRecorder';
import { Paperclip, Send, X, FileText } from 'lucide-react';

const MessageInput = () => {
  const { currentChat } = useContext(ChatContext);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!currentChat) return null;

  const handleSendVoice = ({ fileUrl, fileType, fileName }) => {
    const socket = getSocket();
    socket?.emit(socketEvents.messageSend, {
      chatId: currentChat.id,
      content: null,
      fileUrl,
      fileType,
      fileName,
    });
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    const socket = getSocket();
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit(socketEvents.typingStart, { chatId: currentChat.id });
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      const socket = getSocket();
      socket?.emit(socketEvents.typingStop, { chatId: currentChat.id });
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await messageService.uploadFile(formData);
      setFile(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    if ((!content.trim() && !file) || isUploading) return;
    handleTypingStop();

    const socket = getSocket();
    socket?.emit(socketEvents.messageSend, {
      chatId: currentChat.id,
      content: content.trim() || null,
      fileUrl: file?.fileUrl || null,
      fileType: file?.fileType || null,
      fileName: file?.fileName || null,
    });

    setContent('');
    setFile(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSend = (content.trim().length > 0 || file) && !isUploading;

  return (
    <div className="border-t border-white/10 bg-[#0F172A]/95 backdrop-blur-xl p-2.5 sm:p-4 pb-safe shrink-0">
      {/* Uploading Status / Selected File Chip */}
      {(file || isUploading) && (
        <div className="mb-2 p-2 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-300 animate-slide-up">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              {isUploading ? 'Uploading file...' : file?.fileName}
            </span>
          </div>
          {!isUploading && (
            <button
              onClick={() => setFile(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Floating Input Row */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0B0F19] rounded-2xl p-1.5 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
        {/* Attachment Button */}
        <label className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-xl cursor-pointer transition active:scale-95 shrink-0">
          <Paperclip className="w-5 h-5" />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {/* Text Input Area */}
        <textarea
          value={content}
          onChange={handleTyping}
          onBlur={handleTypingStop}
          onKeyDown={handleKeyPress}
          placeholder="Message..."
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base px-2 py-1.5 focus:outline-none resize-none max-h-32 min-w-0"
          style={{ minHeight: '28px' }}
        />

        {/* Voice Note Recorder Button */}
        <VoiceRecorder chatId={currentChat.id} onSent={handleSendVoice} />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!canSend}
          className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center ${
            canSend
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 active:scale-95'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
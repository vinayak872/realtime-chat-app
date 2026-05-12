import React, { useContext, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { messageService } from '../services/api';
import { getSocket, socketEvents } from '../services/socket';

const MessageInput = () => {
  const { currentChat, addMessage } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const socket = getSocket();

  const handleTyping = (e) => {
    setContent(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket?.emit(socketEvents.typingStart, { chatId: currentChat.id });
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      socket?.emit(socketEvents.typingStop, { chatId: currentChat.id });
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await messageService.uploadFile(formData);
      setFile(response.data);
      // Auto-send file message
      handleSendFile(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  const handleSendFile = (fileData) => {
    socket?.emit(socketEvents.messageSend, {
      chatId: currentChat.id,
      content: null,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType,
      fileName: fileData.fileName,
    });
    setFile(null);
  };

  const handleSendMessage = () => {
    if (!content.trim() && !file) return;

    handleTypingStop();

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

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {file && (
        <div className="bg-light p-2 rounded mb-2 flex justify-between items-center text-sm">
          <span>📎 {file.fileName}</span>
          <button onClick={() => setFile(null)} className="text-red-500">✕</button>
        </div>
      )}
      <div className="flex gap-3">
        <label className="cursor-pointer text-primary hover:text-green-700 transition">
          <span>📎</span>
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </label>
        <textarea
          value={content}
          onChange={handleTyping}
          onBlur={handleTypingStop}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary resize-none message-input"
          rows="1"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!content.trim() && !file}
          className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

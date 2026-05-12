import React, { useContext, useEffect, useState } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { chatService } from '../services/api';
import { initializeSocket, getSocket, socketEvents } from '../services/socket';

const Home = () => {
  const { user } = useContext(AuthContext);
  const { token } = useContext(AuthContext);
  const { currentChat, setChats } = useContext(ChatContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }

    const fetchChats = async () => {
      try {
        const response = await chatService.getUserChats();
        setChats(response.data.chats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-light">
      <ChatList />
      {currentChat ? <ChatWindow /> : <div className="flex-1 bg-white flex items-center justify-center"><p className="text-gray-400">Select a chat to start messaging</p></div>}
    </div>
  );
};

export default Home;

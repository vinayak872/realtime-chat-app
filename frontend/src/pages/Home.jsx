import React, { useContext, useEffect, useState } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { chatService } from '../services/api';
import { initializeSocket, getSocket } from '../services/socket';
import { MessageSquare, Shield, PhoneCall, Zap, Sparkles } from 'lucide-react';

const Home = () => {
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
  }, [token, setChats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#0B0F19] text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 animate-pulse">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#0B0F19] text-slate-100 overflow-hidden">
      {/* Chat List Sidebar (Visible on mobile if no currentChat, always visible on desktop) */}
      <div
        className={`${
          currentChat ? 'hidden md:flex' : 'flex'
        } w-full md:w-[380px] lg:w-[420px] shrink-0 h-full border-r border-white/10 flex-col bg-[#0F172A]/95 backdrop-blur-xl z-10 transition-all duration-300`}
      >
        <ChatList />
      </div>

      {/* Main Chat Area or Desktop Welcome State */}
      <div
        className={`${
          currentChat ? 'flex' : 'hidden md:flex'
        } flex-1 h-full w-full flex-col bg-[#0B0F19] relative overflow-hidden`}
      >
        {currentChat ? (
          <ChatWindow />
        ) : (
          /* Desktop Empty State Screen */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-[#0F172A]/40 to-[#0B0F19]">
            {/* Ambient Lighting */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-md flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-2xl shadow-emerald-500/20 mb-6 flex items-center justify-center">
                <div className="w-full h-full bg-[#0B0F19] rounded-[22px] flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Pulse Web Messenger
              </h2>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Connect instantly with friends and teammates. Send messages, share media, and make high-definition voice and video calls.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                  <Zap className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <span className="text-xs font-semibold text-white">Instant</span>
                  <span className="text-[11px] text-slate-400">Real-time sync</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                  <PhoneCall className="w-5 h-5 text-cyan-400 mb-1.5" />
                  <span className="text-xs font-semibold text-white">HD Calls</span>
                  <span className="text-[11px] text-slate-400">Audio & Video</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                  <Shield className="w-5 h-5 text-indigo-400 mb-1.5" />
                  <span className="text-xs font-semibold text-white">Secure</span>
                  <span className="text-[11px] text-slate-400">Private peers</span>
                </div>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select any contact from the left to begin</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

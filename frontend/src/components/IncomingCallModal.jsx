import React, { useContext } from 'react';
import { CallContext } from '../context/CallContext';
import { Phone, PhoneOff, Video } from 'lucide-react';

const IncomingCallModal = () => {
  const { callStatus, caller, callType, acceptCall, rejectCall } = useContext(CallContext);

  if (callStatus !== 'incoming' || !caller) {
    return null;
  }

  const isVideo = callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-dark/95 border border-white/10 p-8 shadow-2xl text-center text-white overflow-hidden backdrop-blur-xl">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Calling Avatar */}
        <div className="relative flex justify-center mb-6">
          <div className="relative flex items-center justify-center">
            {/* Ripple rings */}
            <div className="absolute w-28 h-28 rounded-full bg-secondary/20 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full bg-secondary/30 animate-pulse" />

            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold text-3xl flex items-center justify-center shadow-lg border-2 border-white/20">
              {caller.profilePic ? (
                <img
                  src={caller.profilePic}
                  alt={caller.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                caller.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-2xl font-semibold tracking-tight text-white mb-1">
          {caller.username}
        </h3>
        <p className="text-sm font-medium text-emerald-400 flex items-center justify-center gap-1.5 mb-8">
          {isVideo ? (
            <>
              <Video className="w-4 h-4 animate-bounce" /> Incoming Video Call...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 animate-bounce" /> Incoming Audio Call...
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-around gap-6 pt-2">
          {/* Decline Button */}
          <button
            onClick={() => rejectCall('Call declined')}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg hover:shadow-rose-600/40 transform hover:scale-105 transition-all duration-200">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-300 group-hover:text-white transition">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-200">
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </div>
            <span className="text-xs font-medium text-gray-300 group-hover:text-white transition">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;

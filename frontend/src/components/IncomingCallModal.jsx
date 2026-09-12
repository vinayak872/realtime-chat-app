import React, { useContext } from 'react';
import { CallContext } from '../context/CallContext';
import { Phone, PhoneOff, Video } from 'lucide-react';

const IncomingCallModal = () => {
  const { callStatus, caller, callType, acceptCall, rejectCall } = useContext(CallContext);

  if (callStatus !== 'incoming' || !caller) {
    return null;
  }

  console.log('[IncomingCallModal] Rendering incoming call modal for caller:', caller);

  const isVideo = callType === 'video';
  const displayName = caller.username || caller.email || 'Incoming Call';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/15 p-8 shadow-2xl text-center text-white overflow-hidden backdrop-blur-2xl">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Calling Avatar */}
        <div className="relative flex justify-center mb-6">
          <div className="relative flex items-center justify-center">
            {/* Ripple rings */}
            <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />

            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white font-bold text-3xl flex items-center justify-center shadow-lg border-2 border-white/20">
              {caller.profilePic ? (
                <img
                  src={caller.profilePic}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-2xl font-bold tracking-tight text-white mb-1">
          {displayName}
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
            type="button"
            onClick={() => rejectCall('Call declined')}
            className="group flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg hover:shadow-rose-600/50 transform hover:scale-105 active:scale-95 transition-all duration-200">
              <PhoneOff className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-rose-300 group-hover:text-white transition">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={acceptCall}
            className="group flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95 transition-all duration-200">
              {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7 animate-pulse" />}
            </div>
            <span className="text-xs font-semibold text-emerald-300 group-hover:text-white transition">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;

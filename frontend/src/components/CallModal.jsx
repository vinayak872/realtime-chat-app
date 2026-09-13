import React, { useContext, useEffect, useRef, useState } from 'react';
import { CallContext } from '../context/CallContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ChevronDown,
} from 'lucide-react';

const formatDuration = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const CallModal = () => {
  const {
    callStatus,
    callType,
    caller,
    callee,
    localStream,
    remoteStream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isSpeakerMuted,
    callDuration,
    callError,
    remoteMediaState,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleSpeakerMuted,
  } = useContext(CallContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (callStatus === 'idle') {
      setIsMinimized(false);
    }
  }, [callStatus]);

  // Attach local or screen stream to local video element
  useEffect(() => {
    if (localVideoRef.current) {
      if (isScreenSharing && screenStream) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(() => {});
      } else if (localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [localStream, screenStream, isScreenSharing, callType]);

  // Attach remote stream to remote video & audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, callType, remoteMediaState]);

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (callStatus !== 'calling' && callStatus !== 'connected') {
    return null;
  }

  const isRemoteScreenSharing = Boolean(remoteMediaState?.screen);
  const isVideo = callType === 'video' || isScreenSharing || isRemoteScreenSharing;
  const peer = callee?.username ? callee : caller;
  const isPeerVideoActive = Boolean(
    remoteStream &&
    remoteStream.getVideoTracks().length > 0 &&
    (remoteMediaState?.video || isRemoteScreenSharing)
  );

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[9990] w-72 sm:w-80 bg-slate-900/95 border border-white/20 rounded-3xl shadow-2xl p-3.5 backdrop-blur-2xl text-white animate-scale-in flex flex-col gap-3 select-none">
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={isSpeakerMuted}
          className="sr-only fixed -top-[9999px] left-0 pointer-events-none opacity-0"
        />

        {/* Mini Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {peer?.profilePic ? (
                <img src={peer.profilePic} alt={peer.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                peer?.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">{peer?.username}</h4>
              <p className="text-[10px] text-emerald-400">
                {callStatus === 'calling' ? 'Calling...' : formatDuration(callDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              title="Expand call"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={endCall}
              className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95"
              title="End call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini Video or Audio Status */}
        {isVideo && isPeerVideoActive ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="py-2.5 px-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Voice call active</span>
          </div>
        )}

        {/* Mini Quick Actions */}
        <div className="flex items-center justify-around pt-1 border-t border-white/10">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl transition active:scale-95 ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2 rounded-xl transition active:scale-95 ${
              isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isVideoOff ? 'Turn video on' : 'Turn video off'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleSpeakerMuted}
            className={`p-2 rounded-xl transition active:scale-95 ${
              isSpeakerMuted ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9990] flex flex-col bg-slate-950 text-white select-none overflow-hidden"
    >
      {/* Remote audio stream playback (accessible to browser autoplay without display:none) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={isSpeakerMuted}
        className="sr-only fixed -top-[9999px] left-0 pointer-events-none opacity-0"
      />

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-sm shadow-md">
            {peer?.profilePic ? (
              <img
                src={peer.profilePic}
                alt={peer.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              peer?.username?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">{peer?.username}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {callStatus === 'calling' ? (
                <span>Calling...</span>
              ) : (
                <span>Connected • {formatDuration(callDuration)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          {callError && (
            <div className="px-3 py-1.5 rounded-full bg-rose-500/90 text-white text-xs font-medium shadow-md backdrop-blur">
              {callError}
            </div>
          )}
          <button
            onClick={toggleSpeakerMuted}
            className={`p-2.5 rounded-full backdrop-blur-md transition ${
              isSpeakerMuted
                ? 'bg-rose-500/80 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition active:scale-95"
            title="Minimize Call (multitask)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {isVideo ? (
          /* Video / Screen Presentation Stage */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Remote Screen Share Active Banner */}
            {isRemoteScreenSharing && (
              <div className="absolute top-20 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md animate-fade-in">
                <MonitorUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{peer?.username || 'Peer'} is sharing their screen</span>
              </div>
            )}

            {/* Remote Video Stream (or Peer Screen) */}
            {isPeerVideoActive ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full ${
                  isRemoteScreenSharing ? 'object-contain bg-black' : 'object-cover md:object-contain'
                }`}
              />
            ) : isScreenSharing ? (
              /* Local User is presenting, remote video is off */
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6 max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl mb-2">
                  <MonitorUp className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-white">You are sharing your screen</h3>
                <p className="text-sm text-gray-400">
                  {peer?.username || 'The other person'} can see your screen right now
                </p>
                <button
                  onClick={toggleScreenShare}
                  className="mt-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition transform hover:scale-105 flex items-center gap-2"
                >
                  <MonitorUp className="w-4 h-4 rotate-180" />
                  Stop Sharing
                </button>
              </div>
            ) : (
              /* Remote Video Off / Calling Placeholder */
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-500/10 animate-ping" />
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold text-4xl flex items-center justify-center shadow-2xl border-4 border-white/10">
                    {peer?.profilePic ? (
                      <img
                        src={peer.profilePic}
                        alt={peer.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      peer?.username?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-medium">{peer?.username}</h3>
                  <p className="text-sm text-gray-400">
                    {callStatus === 'calling'
                      ? 'Waiting for answer...'
                      : !remoteMediaState.video
                      ? 'Camera turned off'
                      : 'Audio active'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video / Screen Thumbnail (PIP) */}
            <div
              className={`absolute bottom-28 right-4 sm:right-6 z-20 overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 transition-all duration-300 rounded-2xl ${
                isScreenSharing ? 'w-44 h-28 sm:w-56 sm:h-36' : 'w-32 h-44 sm:w-44 sm:h-60'
              }`}
            >
              {isScreenSharing ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] font-semibold text-white uppercase tracking-wider shadow">
                    Your Screen
                  </div>
                </div>
              ) : isVideoOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-2 text-center">
                  <VideoOff className="w-6 h-6 mb-1 text-gray-500" />
                  <span className="text-[11px]">Camera off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              )}
              {isMuted && (
                <div className="absolute bottom-2 left-2 p-1.5 rounded-full bg-rose-600/90 text-white shadow">
                  <MicOff className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Voice Call View */
          <div className="relative flex flex-col items-center justify-center p-8 text-center max-w-md w-full">
            {/* Ambient Background Aura */}
            <div className="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            {/* Pulsating Avatar */}
            <div className="relative mb-6 flex items-center justify-center">
              {callStatus === 'calling' && (
                <div className="absolute w-44 h-44 rounded-full bg-secondary/15 animate-ping" />
              )}
              <div className="absolute w-36 h-36 rounded-full bg-secondary/20 animate-pulse" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold text-4xl flex items-center justify-center shadow-2xl border-4 border-white/20">
                {peer?.profilePic ? (
                  <img
                    src={peer.profilePic}
                    alt={peer.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  peer?.username?.charAt(0).toUpperCase() || '?'
                )}
              </div>
            </div>

            <h3 className="text-3xl font-semibold tracking-tight text-white mb-2">
              {peer?.username}
            </h3>

            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm text-emerald-300 mb-2 font-medium">
              {callStatus === 'calling' ? (
                'Calling...'
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {formatDuration(callDuration)} • HD Audio
                </>
              )}
            </div>

            {!remoteMediaState.audio && (
              <p className="text-xs text-amber-400 mt-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                {peer?.username} has muted their microphone
              </p>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Control Dock */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4 sm:gap-6 px-6 py-4 rounded-full bg-gray-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
          {/* Mute Microphone */}
          <button
            onClick={toggleMute}
            className={`p-3.5 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
              isMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Toggle Video Camera */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
              isVideoOff
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Screen Share (Desktop browsers supporting getDisplayMedia) */}
          {Boolean(typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) && (
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
                isScreenSharing
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-3.5 sm:p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 transition-all duration-200 transform hover:scale-110"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;

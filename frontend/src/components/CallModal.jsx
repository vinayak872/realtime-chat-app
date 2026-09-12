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
  const containerRef = useRef(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  // Attach remote stream to remote video & audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

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

  const isVideo = callType === 'video';
  const peer = callee?.username ? callee : caller;
  const isPeerVideoActive = Boolean(
    remoteStream &&
    remoteStream.getVideoTracks().length > 0 &&
    remoteMediaState.video
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden"
    >
      {/* Hidden audio element for remote audio stream playback */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={isSpeakerMuted}
        style={{ display: 'none' }}
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
          /* Video Call View */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Remote Video Stream */}
            {isPeerVideoActive ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover md:object-contain"
              />
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

            {/* Local Video Thumbnail (PIP) */}
            <div className="absolute bottom-28 right-6 z-20 w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 transition-all duration-300">
              {isVideoOff ? (
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
                  className={`w-full h-full object-cover ${isScreenSharing ? '' : '-scale-x-100'}`}
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

          {/* Screen Share (Desktop only) */}
          {navigator.mediaDevices?.getDisplayMedia && (
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
                isScreenSharing
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
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

import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { getSocket, initializeSocket, socketEvents } from '../services/socket';
import {
  playIncomingRingtone,
  playOutgoingDialTone,
  playCallConnected,
  playCallEnded,
  stopAllCallSounds,
} from '../utils/callSounds';

export const CallContext = createContext();

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);

  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [activeCallId, setActiveCallId] = useState(null);
  const [targetChatId, setTargetChatId] = useState(null);

  const [caller, setCaller] = useState(null);
  const [callee, setCallee] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState(null);

  const [remoteMediaState, setRemoteMediaState] = useState({
    audio: true,
    video: true,
  });

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const timerRef = useRef(null);

  // Stop media tracks
  const stopMediaTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch (e) {}
      screenTrackRef.current = null;
      setIsScreenSharing(false);
    }
    setRemoteStream(null);
  }, []);

  // Cleanup connection & reset
  const cleanupCall = useCallback((playEndSound = true) => {
    if (playEndSound) {
      playCallEnded();
    } else {
      stopAllCallSounds();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];
    stopMediaTracks();

    setCallStatus('idle');
    setActiveCallId(null);
    setTargetChatId(null);
    setCaller(null);
    setCallee(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsSpeakerMuted(false);
    setCallDuration(0);
    setRemoteMediaState({ audio: true, video: true });
  }, [stopMediaTracks]);

  // Create Peer Connection
  const createPeerConnection = useCallback((otherUserId, currentCallId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket) {
          socket.emit(socketEvents.callSignal, {
            toUserId: otherUserId,
            callId: currentCallId,
            signal: {
              type: 'candidate',
              candidate: event.candidate,
            },
          });
        }
      }
    };

    // Receive remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  }, []);

  // Process queued ICE candidates
  const processPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding queued ICE candidate:', err);
      }
    }
  }, []);

  // Start Call (Caller)
  const startCall = useCallback(async ({ targetUser, callType: requestedType = 'audio', chatId }) => {
    try {
      setCallError(null);
      const socket = getSocket();
      if (!socket) {
        setCallError('Socket connection not established');
        return;
      }

      setCallType(requestedType);
      setCallee(targetUser);
      setCaller(user);
      setTargetChatId(chatId);
      setCallStatus('calling');
      setIsVideoOff(requestedType === 'audio');

      // Request media stream first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: requestedType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
      } catch (mediaErr) {
        console.warn('Failed with ideal video constraints, retrying basic media:', mediaErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: requestedType === 'video',
        });
      }

      localStreamRef.current = stream;
      playOutgoingDialTone();

      // Emit initiate event with normalized target ID
      const targetUserId = Number(targetUser.id || targetUser.userId || targetUser._id);
      socket.emit(socketEvents.callInitiate, {
        toUserId: targetUserId,
        callType: requestedType,
        chatId,
      });
    } catch (err) {
      console.error('Error starting call:', err);
      stopAllCallSounds();
      stopMediaTracks();
      setCallStatus('idle');
      setCallError(err.name === 'NotAllowedError' ? 'Microphone/Camera permission denied' : 'Could not access media devices');
    }
  }, [user, stopMediaTracks]);

  // Accept Call (Callee)
  const acceptCall = useCallback(async () => {
    try {
      setCallError(null);
      stopAllCallSounds();

      const socket = getSocket();
      if (!socket || !activeCallId || !caller) return;

      // Callee gets media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create peer connection
      createPeerConnection(Number(caller.id), activeCallId);

      socket.emit(socketEvents.callAccept, {
        callId: activeCallId,
      });

      setCallStatus('connected');
      playCallConnected();

      // Start duration timer
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accepting call:', err);
      stopAllCallSounds();
      cleanupCall(false);
      setCallError(err.name === 'NotAllowedError' ? 'Permission denied for camera/microphone' : 'Failed to access audio/video');
    }
  }, [activeCallId, caller, callType, cleanupCall, createPeerConnection]);

  // Reject Call (Callee)
  const rejectCall = useCallback((reason = 'Call declined') => {
    stopAllCallSounds();
    const socket = getSocket();
    if (socket && activeCallId) {
      socket.emit(socketEvents.callReject, {
        callId: activeCallId,
        reason,
      });
    }
    cleanupCall(false);
  }, [activeCallId, cleanupCall]);

  // End active call (Either party)
  const endCall = useCallback(() => {
    const socket = getSocket();
    if (socket && activeCallId) {
      socket.emit(socketEvents.callEnd, {
        callId: activeCallId,
      });
    }
    cleanupCall(true);
  }, [activeCallId, cleanupCall]);

  // Toggle Microphone Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const newMuted = !isMuted;
    audioTracks.forEach((track) => {
      track.enabled = !newMuted;
    });
    setIsMuted(newMuted);

    const otherUser = user?.id === caller?.id ? callee : caller;
    const socket = getSocket();
    if (socket && otherUser && activeCallId) {
      socket.emit(socketEvents.callMediaState, {
        toUserId: otherUser.id,
        mediaType: 'audio',
        enabled: !newMuted,
        callId: activeCallId,
      });
    }
  }, [isMuted, user, caller, callee, activeCallId]);

  // Toggle Camera On / Off
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();

    if (videoTracks.length === 0) {
      // If we don't have a video track yet (e.g. started as audio call), request camera!
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);

        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
          // Renegotiate if needed
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          const otherUser = user?.id === caller?.id ? callee : caller;
          const socket = getSocket();
          if (socket && otherUser) {
            socket.emit(socketEvents.callSignal, {
              toUserId: otherUser.id,
              callId: activeCallId,
              signal: { type: 'offer', sdp: offer },
            });
          }
        }

        setCallType('video');
        setIsVideoOff(false);
      } catch (err) {
        console.error('Error enabling camera:', err);
      }
      return;
    }

    const newVideoOff = !isVideoOff;
    videoTracks.forEach((track) => {
      track.enabled = !newVideoOff;
    });
    setIsVideoOff(newVideoOff);

    const otherUser = user?.id === caller?.id ? callee : caller;
    const socket = getSocket();
    if (socket && otherUser && activeCallId) {
      socket.emit(socketEvents.callMediaState, {
        toUserId: otherUser.id,
        mediaType: 'video',
        enabled: !newVideoOff,
        callId: activeCallId,
      });
    }
  }, [isVideoOff, user, caller, callee, activeCallId]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      if (localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (cameraTrack && peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          } else {
            peerConnectionRef.current.addTrack(screenTrack, localStreamRef.current);
          }
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          screenTrackRef.current = null;
          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender && camTrack) {
              sender.replaceTrack(camTrack);
            }
          }
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  }, [isScreenSharing]);

  // Toggle Speaker Audio Mute (for remote incoming audio)
  const toggleSpeakerMuted = useCallback(() => {
    setIsSpeakerMuted((prev) => !prev);
  }, []);

  // Socket event listener bindings
  useEffect(() => {
    if (!token) return;
    const socket = getSocket() || initializeSocket(token);
    if (!socket) return;

    // Outgoing ringing confirmation
    const handleCallRinging = (data) => {
      setActiveCallId(data.callId);
    };

    // Incoming call received
    const handleCallIncoming = (data) => {
      console.log('[CallContext] Incoming call received from socket:', data);
      setActiveCallId(data.callId);
      setCaller(data.caller || { id: data.fromUserId, username: 'Caller' });
      setCallee(user);
      setCallType(data.callType || 'audio');
      setTargetChatId(data.chatId);
      setCallStatus('incoming');
      setIsVideoOff((data.callType || 'audio') === 'audio');
      try {
        playIncomingRingtone();
      } catch (soundErr) {
        console.warn('Could not play incoming ringtone:', soundErr);
      }
    };

    // Callee accepted call (Caller receives this)
    const handleCallAccepted = async (data) => {
      try {
        stopAllCallSounds();
        playCallConnected();
        setCallStatus('connected');
        setCallee(data.callee);

        // Start timer
        setCallDuration(0);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

        // Caller creates peer connection and sends SDP offer
        const calleeId = Number(data.callee.id);
        const pc = createPeerConnection(calleeId, data.callId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit(socketEvents.callSignal, {
          toUserId: calleeId,
          callId: data.callId,
          signal: {
            type: 'offer',
            sdp: offer,
          },
        });
      } catch (err) {
        console.error('Error in handleCallAccepted:', err);
      }
    };

    // Callee receives call:started confirmation
    const handleCallStarted = (data) => {
      setCaller(data.caller);
    };

    // Call Rejected
    const handleCallRejected = (data) => {
      stopAllCallSounds();
      setCallError(data.reason || 'Call was declined');
      setTimeout(() => {
        cleanupCall(false);
      }, 1500);
    };

    // Call Busy
    const handleCallBusy = (data) => {
      stopAllCallSounds();
      setCallError(data.reason || 'User is on another call');
      setTimeout(() => {
        cleanupCall(false);
      }, 2000);
    };

    // Call Unavailable (Offline)
    const handleCallUnavailable = (data) => {
      stopAllCallSounds();
      setCallError(data.reason || 'User is offline');
      setTimeout(() => {
        cleanupCall(false);
      }, 2000);
    };

    // Call Error
    const handleCallError = (data) => {
      stopAllCallSounds();
      setCallError(data.message || 'Call failed');
      setTimeout(() => {
        cleanupCall(false);
      }, 2000);
    };

    // Call Ended by Peer
    const handleCallEnded = () => {
      cleanupCall(true);
    };

    // Peer Media State Changed (muted, video stopped)
    const handleMediaState = (data) => {
      setRemoteMediaState((prev) => ({
        ...prev,
        [data.mediaType]: data.enabled,
      }));
    };

    // WebRTC Signaling Event
    const handleCallSignal = async (data) => {
      try {
        const { fromUserId, signal, callId } = data;
        const peerId = Number(fromUserId);
        let pc = peerConnectionRef.current;

        if (!pc) {
          pc = createPeerConnection(peerId, callId);
        }

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await processPendingCandidates();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit(socketEvents.callSignal, {
            toUserId: peerId,
            callId,
            signal: {
              type: 'answer',
              sdp: answer,
            },
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await processPendingCandidates();
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            pendingCandidatesRef.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('Error handling call:signal:', err);
      }
    };

    socket.on(socketEvents.callRinging, handleCallRinging);
    socket.on(socketEvents.callIncoming, handleCallIncoming);
    socket.on(socketEvents.callAccepted, handleCallAccepted);
    socket.on(socketEvents.callStarted, handleCallStarted);
    socket.on(socketEvents.callRejected, handleCallRejected);
    socket.on(socketEvents.callBusy, handleCallBusy);
    socket.on(socketEvents.callUnavailable, handleCallUnavailable);
    socket.on(socketEvents.callError, handleCallError);
    socket.on(socketEvents.callEnded, handleCallEnded);
    socket.on(socketEvents.callMediaState, handleMediaState);
    socket.on(socketEvents.callSignal, handleCallSignal);

    return () => {
      socket.off(socketEvents.callRinging, handleCallRinging);
      socket.off(socketEvents.callIncoming, handleCallIncoming);
      socket.off(socketEvents.callAccepted, handleCallAccepted);
      socket.off(socketEvents.callStarted, handleCallStarted);
      socket.off(socketEvents.callRejected, handleCallRejected);
      socket.off(socketEvents.callBusy, handleCallBusy);
      socket.off(socketEvents.callUnavailable, handleCallUnavailable);
      socket.off(socketEvents.callError, handleCallError);
      socket.off(socketEvents.callEnded, handleCallEnded);
      socket.off(socketEvents.callMediaState, handleMediaState);
      socket.off(socketEvents.callSignal, handleCallSignal);
    };
  }, [user, token, createPeerConnection, processPendingCandidates, cleanupCall]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        activeCallId,
        targetChatId,
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
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        toggleSpeakerMuted,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

import { User, Message, Chat } from '../models/index.js';
import { verifyToken } from '../utils/jwt.js';

const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // chatId -> Set of userIds
const activeCalls = new Map(); // callId -> call details
const userCallMap = new Map(); // userId -> callId

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User comes online
    socket.on('user:online', async (data) => {
      try {
        const token = data?.token;
        const decoded = verifyToken(token);

        if (!decoded) {
          socket.disconnect();
          return;
        }

        const userId = Number(decoded.userId);
        onlineUsers.set(userId, socket.id);
        onlineUsers.set(String(userId), socket.id);

        await User.update({ status: 'online', lastSeen: new Date() }, { where: { id: userId } });

        io.emit('user:status-change', {
          userId,
          status: 'online',
        });

        socket.userId = userId;
        socket.join(`user:${userId}`);
        socket.join(`user:${String(userId)}`);

        console.log(`User ${userId} is now online (socket: ${socket.id})`);
      } catch (error) {
        console.error('Error in user:online:', error);
      }
    });

    // Send message event
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, fileUrl, fileType, fileName } = data;
        const userId = Number(socket.userId);

        if (!chatId || (!content && !fileUrl)) {
          return;
        }

        const message = await Message.create({
          chatId,
          senderId: userId,
          content: content || null,
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          fileName: fileName || null,
        });

        const chat = await Chat.findByPk(chatId);
        const receiverId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;

        const messageData = {
          id: message.id,
          chatId,
          senderId: userId,
          content: message.content,
          fileUrl: message.fileUrl,
          fileType: message.fileType,
          fileName: message.fileName,
          createdAt: message.createdAt,
          isRead: false,
        };

        // Emit to both sender and receiver
        io.to(`user:${userId}`).to(`user:${String(userId)}`).emit('message:new', messageData);
        io.to(`user:${receiverId}`).to(`user:${String(receiverId)}`).emit('message:new', messageData);

        socket.emit('message:sent', {
          id: message.id,
          chatId,
        });
      } catch (error) {
        console.error('Error in message:send:', error);
      }
    });

    // Mark message as read
    socket.on('message:read', async (data) => {
      try {
        const { messageId, chatId } = data;
        const userId = Number(socket.userId);

        const message = await Message.findByPk(messageId);
        if (message && message.senderId !== userId) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();

          const chat = await Chat.findByPk(chatId);
          const senderId = message.senderId;

          io.to(`user:${senderId}`).to(`user:${String(senderId)}`).emit('message:read-receipt', {
            messageId,
            chatId,
          });
        }
      } catch (error) {
        console.error('Error in message:read:', error);
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      try {
        const { chatId } = data;
        const userId = Number(socket.userId);

        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }

        typingUsers.get(chatId).add(userId);

        socket.broadcast.emit('typing:indicator', {
          chatId,
          userId,
          isTyping: true,
        });
      } catch (error) {
        console.error('Error in typing:start:', error);
      }
    });

    socket.on('typing:stop', (data) => {
      try {
        const { chatId } = data;
        const userId = Number(socket.userId);

        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }

        typingUsers.get(chatId).delete(userId);

        socket.broadcast.emit('typing:indicator', {
          chatId,
          userId,
          isTyping: false,
        });
      } catch (error) {
        console.error('Error in typing:stop:', error);
      }
    });

    // ==========================================
    // Call Signaling & Management Events
    // ==========================================

    // Initiate Call
    socket.on('call:initiate', async (data) => {
      try {
        const { toUserId, callType = 'audio', chatId } = data;
        const callerId = socket.userId ? Number(socket.userId) : null;
        const targetUserId = toUserId ? Number(toUserId) : null;

        console.log(`[call:initiate] Caller: ${callerId} -> Recipient: ${targetUserId} (Type: ${callType})`);

        if (!callerId || !targetUserId) {
          console.warn(`[call:initiate] Missing callerId (${callerId}) or targetUserId (${targetUserId})`);
          socket.emit('call:error', { message: 'Invalid call parameters' });
          return;
        }

        // Check if recipient is online: check onlineUsers or active socket room
        const recipientRoom = io.sockets.adapter.rooms.get(`user:${targetUserId}`) ||
                              io.sockets.adapter.rooms.get(`user:${String(targetUserId)}`);
        const isRecipientConnected = (recipientRoom && recipientRoom.size > 0) ||
                                     onlineUsers.has(targetUserId) ||
                                     onlineUsers.has(String(targetUserId));

        if (!isRecipientConnected) {
          console.log(`[call:initiate] Recipient ${targetUserId} is offline`);
          socket.emit('call:unavailable', {
            toUserId: targetUserId,
            reason: 'User is currently offline'
          });
          return;
        }

        // Check if caller or recipient is busy
        if (userCallMap.has(callerId)) {
          socket.emit('call:error', { message: 'You are already in an active call' });
          return;
        }

        if (userCallMap.has(targetUserId)) {
          socket.emit('call:busy', {
            toUserId: targetUserId,
            reason: 'User is on another call'
          });
          return;
        }

        const caller = await User.findByPk(callerId, {
          attributes: ['id', 'username', 'email', 'profilePicture']
        });

        const callId = `call_${Date.now()}_${callerId}_${targetUserId}`;
        const callerData = caller
          ? { ...caller.toJSON(), profilePic: caller.profilePicture }
          : { id: callerId, username: 'Caller' };

        const callData = {
          callId,
          callerId,
          calleeId: targetUserId,
          callType,
          chatId,
          startTime: null,
          status: 'ringing',
          caller: callerData
        };

        activeCalls.set(callId, callData);
        userCallMap.set(callerId, callId);
        userCallMap.set(targetUserId, callId);

        console.log(`[call:initiate] Emitting call:incoming to user:${targetUserId}`);

        // Notify recipient with incoming call event (to both numeric and string rooms)
        io.to(`user:${targetUserId}`).to(`user:${String(targetUserId)}`).emit('call:incoming', {
          callId,
          fromUserId: callerId,
          caller: callData.caller,
          callType: callData.callType,
          chatId
        });

        // Notify caller that call is ringing
        socket.emit('call:ringing', {
          callId,
          toUserId: targetUserId,
          callType: callData.callType
        });
      } catch (error) {
        console.error('Error in call:initiate:', error);
        socket.emit('call:error', { message: 'Failed to initiate call' });
      }
    });

    // Accept Call
    socket.on('call:accept', async (data) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call) {
          socket.emit('call:error', { message: 'Call session not found' });
          return;
        }

        call.status = 'active';
        call.startTime = Date.now();

        const calleeId = Number(socket.userId);
        const callee = await User.findByPk(calleeId, {
          attributes: ['id', 'username', 'email', 'profilePicture']
        });

        const calleeData = callee
          ? { ...callee.toJSON(), profilePic: callee.profilePicture }
          : { id: calleeId };

        console.log(`[call:accept] Call ${callId} accepted by ${calleeId}`);

        // Notify caller that call was accepted
        io.to(`user:${call.callerId}`).to(`user:${String(call.callerId)}`).emit('call:accepted', {
          callId,
          callee: calleeData
        });

        // Confirm to callee
        socket.emit('call:started', {
          callId,
          caller: call.caller
        });
      } catch (error) {
        console.error('Error in call:accept:', error);
      }
    });

    // Reject / Decline Call
    socket.on('call:reject', async (data) => {
      try {
        const { callId, reason = 'Call declined' } = data;
        const call = activeCalls.get(callId);

        if (call) {
          console.log(`[call:reject] Call ${callId} rejected: ${reason}`);
          io.to(`user:${call.callerId}`).to(`user:${String(call.callerId)}`).emit('call:rejected', {
            callId,
            reason
          });

          // Log declined call in chat
          if (call.chatId) {
            const content = call.callType === 'video' ? '📹 Video call declined' : '📞 Voice call declined';
            const message = await Message.create({
              chatId: call.chatId,
              senderId: call.callerId,
              content,
              fileType: 'call_declined',
              fileName: null,
              fileUrl: null
            });

            const messageData = {
              id: message.id,
              chatId: call.chatId,
              senderId: call.callerId,
              content: message.content,
              fileType: message.fileType,
              createdAt: message.createdAt,
              isRead: false
            };

            io.to(`user:${call.callerId}`).to(`user:${String(call.callerId)}`).emit('message:new', messageData);
            io.to(`user:${call.calleeId}`).to(`user:${String(call.calleeId)}`).emit('message:new', messageData);
          }

          userCallMap.delete(call.callerId);
          userCallMap.delete(call.calleeId);
          activeCalls.delete(callId);
        }
      } catch (error) {
        console.error('Error in call:reject:', error);
      }
    });

    // Relay WebRTC Signal (Offer, Answer, ICE Candidate)
    socket.on('call:signal', (data) => {
      try {
        const { toUserId, signal, callId } = data;
        const fromUserId = Number(socket.userId);
        const targetId = Number(toUserId);

        if (!targetId || !signal) return;

        io.to(`user:${targetId}`).to(`user:${String(targetId)}`).emit('call:signal', {
          fromUserId,
          signal,
          callId
        });
      } catch (error) {
        console.error('Error in call:signal:', error);
      }
    });

    // Media State changes (Mute Audio / Camera Off)
    socket.on('call:media-state', (data) => {
      try {
        const { toUserId, mediaType, enabled, callId } = data;
        const targetId = Number(toUserId);
        io.to(`user:${targetId}`).to(`user:${String(targetId)}`).emit('call:media-state', {
          fromUserId: Number(socket.userId),
          mediaType,
          enabled,
          callId
        });
      } catch (error) {
        console.error('Error in call:media-state:', error);
      }
    });

    // End Call
    socket.on('call:end', async (data) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (call) {
          const currentUserId = Number(socket.userId);
          const otherUserId = currentUserId === call.callerId ? call.calleeId : call.callerId;

          let durationSeconds = 0;
          if (call.startTime) {
            durationSeconds = Math.max(0, Math.round((Date.now() - call.startTime) / 1000));
          }

          const minutes = Math.floor(durationSeconds / 60);
          const seconds = durationSeconds % 60;
          const durationFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

          console.log(`[call:end] Call ${callId} ended by ${currentUserId}, duration: ${durationFormatted}`);

          io.to(`user:${otherUserId}`).to(`user:${String(otherUserId)}`).emit('call:ended', {
            callId,
            duration: durationSeconds,
            reason: 'Call ended'
          });

          socket.emit('call:ended', {
            callId,
            duration: durationSeconds,
            reason: 'Call ended'
          });

          // Create call summary message in chat
          if (call.chatId) {
            let content;
            let fileType;

            if (call.status === 'active') {
              content = call.callType === 'video'
                ? `📹 Video call ended • ${durationFormatted}`
                : `📞 Voice call ended • ${durationFormatted}`;
              fileType = 'call_ended';
            } else {
              content = call.callType === 'video'
                ? '📹 Missed video call'
                : '📞 Missed voice call';
              fileType = 'call_missed';
            }

            const message = await Message.create({
              chatId: call.chatId,
              senderId: call.callerId,
              content,
              fileType,
              fileName: null,
              fileUrl: null
            });

            const messageData = {
              id: message.id,
              chatId: call.chatId,
              senderId: call.callerId,
              content: message.content,
              fileType: message.fileType,
              createdAt: message.createdAt,
              isRead: false
            };

            io.to(`user:${call.callerId}`).to(`user:${String(call.callerId)}`).emit('message:new', messageData);
            io.to(`user:${call.calleeId}`).to(`user:${String(call.calleeId)}`).emit('message:new', messageData);
          }

          userCallMap.delete(call.callerId);
          userCallMap.delete(call.calleeId);
          activeCalls.delete(callId);
        }
      } catch (error) {
        console.error('Error in call:end:', error);
      }
    });

    // User comes offline / disconnects
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId ? Number(socket.userId) : null;

        if (userId) {
          // If user was in an active call, terminate it cleanly
          if (userCallMap.has(userId)) {
            const callId = userCallMap.get(userId);
            const call = activeCalls.get(callId);

            if (call) {
              const otherUserId = userId === call.callerId ? call.calleeId : call.callerId;
              io.to(`user:${otherUserId}`).to(`user:${String(otherUserId)}`).emit('call:ended', {
                callId,
                reason: 'User disconnected'
              });

              userCallMap.delete(call.callerId);
              userCallMap.delete(call.calleeId);
              activeCalls.delete(callId);
            }
          }

          const remainingRoom = io.sockets.adapter.rooms.get(`user:${userId}`) || io.sockets.adapter.rooms.get(`user:${String(userId)}`);
          if (!remainingRoom || remainingRoom.size === 0) {
            onlineUsers.delete(userId);
            onlineUsers.delete(String(userId));
            await User.update({ status: 'offline', lastSeen: new Date() }, { where: { id: userId } }).catch(() => {});

            io.emit('user:status-change', {
              userId,
              status: 'offline',
            });

            console.log(`User ${userId} is now offline`);
          }
        }

        console.log('User disconnected:', socket.id);
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });

    // Cleanup on error
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

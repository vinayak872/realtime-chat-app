import { User, Message, Chat } from '../models/index.js';
import { verifyToken } from '../utils/jwt.js';

const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // chatId -> Set of userIds

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User comes online
    socket.on('user:online', async (data) => {
      try {
        const token = data.token;
        const decoded = verifyToken(token);

        if (!decoded) {
          socket.disconnect();
          return;
        }

        const userId = decoded.userId;
        onlineUsers.set(userId, socket.id);

        await User.update({ status: 'online', lastSeen: new Date() }, { where: { id: userId } });

        io.emit('user:status-change', {
          userId,
          status: 'online',
        });

        socket.userId = userId;
        socket.join(`user:${userId}`);

        console.log(`User ${userId} is now online`);
      } catch (error) {
        console.error('Error in user:online:', error);
      }
    });

    // Send message event
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, fileUrl, fileType, fileName } = data;
        const userId = socket.userId;

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
        io.to(`user:${userId}`).emit('message:new', messageData);
        io.to(`user:${receiverId}`).emit('message:new', messageData);

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
        const userId = socket.userId;

        const message = await Message.findByPk(messageId);
        if (message && message.senderId !== userId) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();

          const chat = await Chat.findByPk(chatId);
          const senderId = message.senderId;

          io.to(`user:${senderId}`).emit('message:read-receipt', {
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
        const userId = socket.userId;

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
        const userId = socket.userId;

        if (typingUsers.has(chatId)) {
          typingUsers.get(chatId).delete(userId);
        }

        socket.broadcast.emit('typing:indicator', {
          chatId,
          userId,
          isTyping: false,
        });
      } catch (error) {
        console.error('Error in typing:stop:', error);
      }
    });

    // User comes offline
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;

        if (userId) {
          onlineUsers.delete(userId);
          await User.update({ status: 'offline', lastSeen: new Date() }, { where: { id: userId } });

          io.emit('user:status-change', {
            userId,
            status: 'offline',
          });

          console.log(`User ${userId} is now offline`);
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

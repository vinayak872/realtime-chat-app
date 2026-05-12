import { Message } from '../models/index.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, fileUrl, fileType, fileName } = req.body;
    const senderId = req.user.userId;

    if (!chatId || (!content && !fileUrl)) {
      return res.status(400).json({ message: 'Invalid message data' });
    }

    const message = await Message.create({
      chatId,
      senderId,
      content: content || null,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      fileName: fileName || null,
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findByPk(messageId, { include: ['chat'] });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId === userId) {
      return res.status(400).json({ message: 'Cannot mark own message as read' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const markChatMessagesAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          chatId,
          senderId: { [require('sequelize').Op.ne]: userId },
          isRead: false,
        },
      }
    );

    res.status(200).json({
      message: 'Chat messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
};

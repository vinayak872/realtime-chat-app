import { Chat, Message, User } from '../models/index.js';
import { Op } from 'sequelize';

export const createChat = async (req, res, next) => {
  try {
    const { user2Id } = req.body;
    const user1Id = req.user.userId;

    if (!user2Id) {
      return res.status(400).json({ message: 'user2Id is required' });
    }

    if (user1Id === user2Id) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    const user2 = await User.findByPk(user2Id);
    if (!user2) {
      return res.status(404).json({ message: 'User not found' });
    }

    let chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });

    if (chat) {
      return res.status(200).json({ chat });
    }

    chat = await Chat.create({
      user1Id,
      user2Id,
    });

    res.status(201).json({
      message: 'Chat created successfully',
      chat,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: [
        { as: 'user1', model: User, attributes: { exclude: ['password'] } },
        { as: 'user2', model: User, attributes: { exclude: ['password'] } },
        { as: 'messages', model: Message, separate: true, limit: 1, order: [['createdAt', 'DESC']] },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const formattedChats = chats.map((chat) => {
      const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;
      const lastMessage = chat.messages?.[0];

      return {
        id: chat.id,
        otherUser,
        lastMessage: lastMessage || null,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({
      chats: formattedChats,
    });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const messages = await Message.findAll({
      where: { chatId },
      include: [
        { as: 'sender', model: User, attributes: { exclude: ['password'] } },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const unreadCounts = await Message.findAll({
      attributes: ['chatId', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'unreadCount']],
      where: {
        [Op.and]: [{ isRead: false }],
      },
      include: [
        {
          model: Chat,
          attributes: [],
          where: {
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
          },
          required: true,
        },
      ],
      group: ['chatId'],
      raw: true,
      subQuery: false,
    });

    res.status(200).json({
      unreadCounts,
    });
  } catch (error) {
    next(error);
  }
};

import express from 'express';
import {
  createChat,
  getUserChats,
  getChatMessages,
  getUnreadCount,
} from '../controllers/chatController.js';
import verifyToken from '../middlewares/auth.js';

const router = express.Router();

router.post('/', verifyToken, createChat);
router.get('/', verifyToken, getUserChats);
router.get('/:chatId/messages', verifyToken, getChatMessages);
router.get('/unread/count', verifyToken, getUnreadCount);

export default router;

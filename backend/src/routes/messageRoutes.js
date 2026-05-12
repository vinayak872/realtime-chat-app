import express from 'express';
import {
  sendMessage,
  markAsRead,
  markChatMessagesAsRead,
  uploadFile,
} from '../controllers/messageController.js';
import verifyToken from '../middlewares/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/', verifyToken, sendMessage);
router.put('/:messageId/read', verifyToken, markAsRead);
router.put('/chat/:chatId/read-all', verifyToken, markChatMessagesAsRead);
router.post('/upload', verifyToken, upload.single('file'), uploadFile);

export default router;

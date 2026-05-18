import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  getAllUsers,
  updateProfile,
} from '../controllers/authController.js';
import verifyToken from '../middlewares/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/profile', verifyToken, getProfile);
router.get('/users', verifyToken, getAllUsers);
router.put('/profile', verifyToken, upload.single('profilePicture'), updateProfile);

export default router;

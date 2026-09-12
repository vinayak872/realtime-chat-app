import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const verifyToken = (rawToken) => {
  try {
    if (!rawToken) return null;
    const token = typeof rawToken === 'string' && rawToken.startsWith('Bearer ')
      ? rawToken.slice(7).trim()
      : rawToken;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

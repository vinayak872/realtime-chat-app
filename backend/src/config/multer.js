import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Strip out codec info (e.g., 'audio/webm;codecs=opus' -> 'audio/webm')
  const baseMimeType = file.mimetype ? file.mimetype.split(';')[0] : 'application/octet-stream';
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'application/octet-stream'
  ];

  const allowedAudioExts = ['.webm', '.mp4', '.ogg', '.wav', '.mp3', '.m4a'];

  // Allow explicit types, plus safely fallback to allow any audio file
  if (allowedMimes.includes(baseMimeType) || baseMimeType.startsWith('audio/') || allowedAudioExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  },
});

export default upload;

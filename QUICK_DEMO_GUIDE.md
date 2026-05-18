# 🚀 Quick Start - Setup & Run Guide

## ✅ Prerequisites
- Node.js v14+ and npm installed
- Terminal/Command line access

## 🛠️ Setup Instructions

### Option 1: Automated Setup (Recommended)

```bash
# From project root
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### Terminal 1 - Backend Setup

```bash
cd backend
npm install
npm start
```

Expected output:
```
📦 Using SQLite database at: ./data/chat_app.db
Database connected successfully
Database models synchronized
Server is running on port 5000
```

#### Terminal 2 - Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
VITE v5.0.0 ready in XXX ms

➜ Local: http://localhost:5173/
```

## 🌐 Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## 📝 First Time Usage

### Create a Test Account

1. Go to http://localhost:5173/register
2. Enter:
   - Username: `test_user`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
3. Click Register

### Test Chat Functionality

#### Option 1: Two Browser Windows
1. Window 1: Register/Login as user1
2. Window 2: Register/Login as user2
3. In Window 1: Click on user2 name to start chat
4. Send a message - appears in real-time in Window 2

#### Option 2: Incognito Window
1. Register user1 in normal window
2. Open incognito window and register user2
3. Follow same chat flow

## ⚙️ Configuration

### Backend (.env)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_complex_12345
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows

# Then restart
npm start
```

### Frontend won't connect to backend
- Verify backend is running on port 5000
- Check .env.local has correct VITE_API_URL
- Check CORS in backend/src/index.js

### Database errors
- Backend uses SQLite automatically
- Database created at `backend/data/chat_app.db`
- Delete this file to reset database

### Socket.IO connection fails
- Ensure backend is running
- Check browser console for error messages
- Verify client URL in backend .env

## 📱 Test Features

### Messaging
✅ Send text messages
✅ Send files/images
✅ Message timestamps
✅ Read receipts
✅ Unread message counter

### User Status
✅ Online/offline status
✅ Last seen indicator
✅ Typing indicators

### UI/UX
✅ Responsive design (mobile, tablet, desktop)
✅ WhatsApp-like interface
✅ Smooth animations
✅ User-friendly error messages

## 💾 Database Reset

To reset the application to initial state:

```bash
# Stop both servers (Ctrl+C)

# Remove database
rm backend/data/chat_app.db

# Restart backend
cd backend
npm start

# Backend will recreate database automatically
```

## 🎯 Key Endpoints to Test

### Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"pass123","confirmPassword":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get all users
curl -X GET http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Performance Tips

- Clear browser cache if experiencing issues
- Use Chrome DevTools Network tab to debug
- Check browser console for error messages
- Ensure both servers are running before testing

## ✨ Interview Demo Flow

1. **Start both servers** (2 terminals)
2. **Open http://localhost:5173**
3. **Register two test users** (or use two browser windows)
4. **Demonstrate features:**
   - User 1 sends message to User 2
   - Real-time delivery shown
   - Show typing indicators
   - Show online/offline status
   - Upload and share a file
   - Show read receipts
   - Refresh page and show persistence

## 📞 Support

If you encounter issues:
1. Check terminal output for error messages
2. Review INTERVIEW_GUIDE.md for architecture details
3. Check .env files are properly configured
4. Ensure ports 5000 and 5173 are available

---

**Ready to go!** Run the application and test all features before your interview. 🎉

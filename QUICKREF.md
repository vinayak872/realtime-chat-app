# 🚀 Quick Reference - Real-Time Chat Application

## 📦 Installation (3 Steps)

```bash
# 1. Run setup script
chmod +x setup.sh && ./setup.sh

# 2. Configure database (in backend/.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password

# 3. Sync database
cd backend && npm run db:sync
```

## ▶️ Run Application

```bash
# Terminal 1 - Backend (Port 5000)
cd backend && npm run dev

# Terminal 2 - Frontend (Port 5173)
cd frontend && npm run dev

# Open: http://localhost:5173
```

## 📚 Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| Server Entry | Main Express server | backend/src/index.js |
| Auth Controller | Login/Register logic | backend/src/controllers/authController.js |
| Socket Handler | Real-time events | backend/src/socket/socketHandler.js |
| User Model | User database model | backend/src/models/User.js |
| Auth Context | User state management | frontend/src/context/AuthContext.jsx |
| Chat Component | Main UI | frontend/src/components/ChatWindow.jsx |
| API Client | HTTP requests | frontend/src/services/api.js |

## 🔌 API Endpoints

```bash
# Auth
POST   /api/auth/register        # Create account
POST   /api/auth/login           # Login
GET    /api/auth/profile         # Get profile
GET    /api/auth/users           # Get all users

# Chats
POST   /api/chats                # Create chat
GET    /api/chats                # Get chats
GET    /api/chats/:id/messages   # Get messages

# Messages  
POST   /api/messages             # Send message
PUT    /api/messages/:id/read    # Mark read
POST   /api/messages/upload      # Upload file
```

## 🔄 Socket.IO Events

```javascript
// Emit (Client → Server)
socket.emit('user:online', {token})
socket.emit('message:send', {chatId, content})
socket.emit('typing:start', {chatId})

// Listen (Server → Client)
socket.on('message:new', (message) => {})
socket.on('user:status-change', (data) => {})
socket.on('typing:indicator', (data) => {})
```

## 🛠️ Common Commands

```bash
# Backend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run db:sync      # Sync database

# Frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production

# Database
npm run db:sync      # Create/update tables
# Or manually: mysql -u root -p < schema.sql
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `lsof -i :5000 && kill -9 <PID>` |
| DB connection error | Check .env credentials and MySQL running |
| Module not found | `rm -rf node_modules && npm install` |
| CORS error | Check CLIENT_URL in backend .env |

## 📁 Environment Files

**Backend (.env)**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=chat_app
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

**Frontend (.env.local)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🗄️ Database Schema

```sql
Users (id, username, email, password, status, lastSeen)
Chats (id, user1Id, user2Id)
Messages (id, chatId, senderId, content, isRead, createdAt)
```

## 🎨 Tailwind Colors

```javascript
primary: '#075E54'   // Green (WhatsApp style)
secondary: '#25D366' // Light green
dark: '#0B141A'      // Dark
light: '#F0F2F5'     // Light gray
```

## 🚀 Deployment Quick Links

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./API_TESTING.md)
- [Architecture Guide](./ARCHITECTURE.md)

## 📖 Documentation

- **README.md** - Full documentation
- **QUICKSTART.md** - Fast setup
- **PROJECT_SUMMARY.md** - Project overview

## ✅ Features Checklist

- [x] User auth (Register/Login)
- [x] Real-time messaging
- [x] Online/offline status
- [x] Typing indicators
- [x] File sharing
- [x] Message read receipts
- [x] JWT authentication
- [x] bcrypt hashing
- [x] MySQL database
- [x] Sequelize ORM
- [x] Responsive UI
- [x] Protected routes
- [x] Error handling

## 🎯 Next Steps

1. **Setup** → Run setup.sh
2. **Configure** → Edit .env files
3. **Test** → Create accounts, send messages
4. **Customize** → Modify UI/features
5. **Deploy** → Follow DEPLOYMENT.md

---

**Version:** 1.0.0 | **Status:** Production Ready ✅

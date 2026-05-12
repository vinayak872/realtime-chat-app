# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 14+
- MySQL 5.7+
- npm or yarn

### Step 1: Clone & Install

```bash
# Navigate to project
cd real-time-chat-application

# Run setup script
chmod +x setup.sh
./setup.sh
```

### Step 2: Configure Database

```bash
# Update backend .env
cd backend
nano .env

# Set your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
```

### Step 3: Sync Database

```bash
npm run db:sync
```

### Step 4: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Open Browser

```
http://localhost:5173
```

## Default Accounts (for testing)

After first sync, create test accounts via UI:
- User 1: test1@example.com / password123
- User 2: test2@example.com / password123

## Common Issues

### Port 5000 already in use
```bash
lsof -i :5000
kill -9 <PID>
```

### MySQL connection error
```bash
# Check MySQL is running
brew services list

# Or start it
mysql.server start
```

### Dependencies not installing
```bash
rm -rf node_modules package-lock.json
npm install
```

## Project Structure Overview

```
├── backend/          # Node.js + Express server
│   └── src/
│       ├── models/   # Sequelize ORM models
│       ├── routes/   # API endpoints
│       ├── controllers/ # Business logic
│       └── socket/   # Real-time Socket.IO
│
├── frontend/         # React + Vite app
│   └── src/
│       ├── pages/    # Login, Register, Home
│       ├── components/ # Chat UI components
│       ├── context/  # State management
│       └── services/ # API & Socket clients
```

## Key Features

✅ Real-time messaging with Socket.IO
✅ User authentication with JWT
✅ MySQL database with Sequelize ORM
✅ File upload support with Multer
✅ Online/offline status tracking
✅ Message read receipts
✅ Typing indicators
✅ Responsive Tailwind CSS UI

## Documentation

- [README.md](./README.md) - Full documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database design
- [API_TESTING.md](./API_TESTING.md) - API examples

## Next Steps

1. Create accounts and test messaging
2. Try file uploads
3. Test from multiple browsers for real-time features
4. Review code in `backend/src` and `frontend/src`
5. Deploy to AWS (see DEPLOYMENT.md)

## Support

For issues:
1. Check error in browser console (F12)
2. Check backend logs in terminal
3. Review API_TESTING.md for API reference
4. Check README.md for troubleshooting

Happy chatting! 🚀

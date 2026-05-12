# 🚀 Chat Application - Setup & Run Instructions

## Current Status

✅ **Project Created Successfully**
- All backend files generated (18 JavaScript files)
- All frontend files generated (12 React/JSX files)  
- Complete documentation created
- Dependencies configured
- Environment files created

⚠️ **Database Connection Required**
- Backend requires MySQL database to be running
- Frontend is ready to run (doesn't need database)

---

## Prerequisites to Run

### 1. **Install MySQL** (Required for Backend)

**macOS:**
```bash
# Using Homebrew
brew install mysql
brew services start mysql

# Or manually start
mysql.server start

# Verify installation
mysql --version
```

**Ubuntu/Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
- Download from https://dev.mysql.com/downloads/mysql/
- Run installer and follow prompts

### 2. **Create Database & User**

```bash
mysql -u root -p

# In MySQL shell:
CREATE DATABASE chat_app;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON chat_app.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. **Verify Setup**

```bash
mysql -u root -p'root' -h localhost chat_app -e "SELECT 1;"
# Should show: | 1 |
```

---

## Running the Application

### **Step 1: Terminal 1 - Backend Server**

```bash
cd /Users/vinayakkumar/real-time-chat-application/backend

# Make sure MySQL is running first!
node src/index.js
```

**Expected Output:**
```
✅ Database connected successfully
✅ Database models synchronized
✅ Server is running on port 5000
```

### **Step 2: Terminal 2 - Frontend Server**

```bash
cd /Users/vinayakkumar/real-time-chat-application/frontend

npm run dev
```

**Expected Output:**
```
✅ VITE v5.0.8 ready in XXX ms

➜ Local:   http://localhost:5173/
➜ Press h + enter to show help
```

### **Step 3: Open Browser**

Navigate to: **http://localhost:5173**

---

## Quick Start with npm

If npm scripts are working:

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd frontend && npm run dev
```

---

## Configuration Files

### Backend (.env)
Location: `/Users/vinayakkumar/real-time-chat-application/backend/.env`

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=chat_app
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_complex_12345
CLIENT_URL=http://localhost:5173
```

### Frontend (.env.local)
Location: `/Users/vinayakkumar/real-time-chat-application/frontend/.env.local`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## First Time Setup

### Complete Setup Script (Automated)

```bash
cd /Users/vinayakkumar/real-time-chat-application

# 1. Install dependencies (already done)
# Backend dependencies: ✅ Installed
# Frontend dependencies: ✅ Installed

# 2. Start MySQL
brew services start mysql  # macOS
# OR
mysql.server start  # macOS
# OR
sudo systemctl start mysql  # Linux

# 3. Create database
mysql -u root -p'root' << EOF
CREATE DATABASE IF NOT EXISTS chat_app;
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON chat_app.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EOF

# 4. Start backend (Terminal 1)
cd backend && node src/index.js

# 5. Start frontend (Terminal 2)
cd frontend && npm run dev

# 6. Open browser
# http://localhost:5173
```

---

## Test the Application

### Create Accounts
1. Click "Register here" on login page
2. Create first account:
   - Username: user1
   - Email: user1@example.com
   - Password: password123

3. Create second account:
   - Username: user2
   - Email: user2@example.com
   - Password: password123

### Test Features
✅ Send messages between accounts (in different browser tabs)
✅ See real-time message delivery
✅ Check online/offline status
✅ Test typing indicators
✅ Upload files/images
✅ Check message read receipts

---

## API Endpoints (Test with Postman/cURL)

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Troubleshooting

### Error: "Connection Refused" to MySQL

**Solution:**
```bash
# Check if MySQL is running
mysql -u root -p'root' -e "SELECT 1;"

# If not running:
brew services start mysql  # macOS
# OR
sudo systemctl start mysql  # Linux
```

### Error: "Port 5000 Already in Use"

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port (edit backend/.env)
PORT=5001
```

### Error: "Port 5173 Already in Use"

```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

### npm: Command Not Found

```bash
# Install Node.js from https://nodejs.org
# Then verify:
node --version
npm --version
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running:
curl http://localhost:5000/api/health

# Check .env.local has correct URLs:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Documentation Reference

- **README.md** - Complete project documentation
- **QUICKSTART.md** - Quick setup guide
- **QUICKREF.md** - Quick reference card
- **API_TESTING.md** - API endpoints & examples
- **DEPLOYMENT.md** - Production deployment
- **DATABASE_SCHEMA.md** - Database design
- **ARCHITECTURE.md** - System architecture

---

## Project Files Location

```
/Users/vinayakkumar/real-time-chat-application/
├── backend/          # Node.js + Express server
├── frontend/         # React + Vite app
└── [documentation]   # README.md, etc.
```

---

## What's Included

✅ Complete Backend Server (Node.js + Express)
✅ Complete Frontend App (React + Vite)
✅ MySQL Database Schema (3 tables)
✅ REST API Endpoints
✅ Socket.IO Real-Time Events
✅ JWT Authentication
✅ File Upload System
✅ Responsive UI (Tailwind CSS)
✅ Comprehensive Documentation
✅ Deployment Guides (AWS, Docker)
✅ Environment Configuration

---

## Next Steps

1. **Install MySQL** if not already installed
2. **Start MySQL** service
3. **Create database** using SQL commands above
4. **Run backend**: `node src/index.js`
5. **Run frontend**: `npm run dev`
6. **Open browser**: http://localhost:5173
7. **Create accounts and test**!

---

## Support

For issues, check:
1. Is MySQL running? (`mysql -u root -p'root' -e "SELECT 1;"`)
2. Are both servers running? (Check terminal output)
3. Check browser console (F12) for errors
4. Check backend terminal for error messages
5. Review QUICKSTART.md or README.md

---

**Status:** ✅ Ready to Run!

Start with MySQL setup, then run the commands above.

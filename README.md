# Real-Time Chat Application

A modern, full-stack real-time chat application built with React.js, Node.js, Express.js, MySQL, and Socket.IO. Features one-to-one messaging, online/offline status, typing indicators, file sharing, and more.

## Features

- ✅ **User Authentication**: JWT-based authentication with secure password hashing
- ✅ **Real-time Messaging**: Instant message delivery using Socket.IO
- ✅ **Online/Offline Status**: Real-time user status updates
- ✅ **Typing Indicators**: See when other users are typing
- ✅ **File & Image Sharing**: Upload and share files seamlessly
- ✅ **Message Read Status**: Know when messages have been seen
- ✅ **Unread Counter**: Track unread messages per chat
- ✅ **Responsive Design**: WhatsApp-style UI for mobile and desktop
- ✅ **Message Persistence**: All messages stored in MySQL database
- ✅ **Protected Routes**: JWT-protected API endpoints
- ✅ **One-to-One Chat**: Direct messaging between users

## Technology Stack

### Frontend
- **React.js 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP requests
- **React Router DOM** - Navigation

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **Sequelize** - ORM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads

## Project Structure

```
real-time-chat-application/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── multer.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Chat.js
│   │   │   ├── Message.js
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   └── messageRoutes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── chatController.js
│   │   │   └── messageController.js
│   │   ├── middlewares/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── socket/
│   │   │   └── socketHandler.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── dbSync.js
│   │   └── index.js
│   ├── uploads/
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatList.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ChatContext.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MySQL (v5.7+)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chat_app
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

CLIENT_URL=http://localhost:5173
```

5. Sync database models:
```bash
npm run db:sync
```

6. Start backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```

4. Update `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

5. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Documentation

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Body**: `{ username, email, password, confirmPassword }`

#### Login User
- **POST** `/api/auth/login`
- **Body**: `{ email, password }`

#### Get Profile
- **GET** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`

#### Get All Users
- **GET** `/api/auth/users`
- **Headers**: `Authorization: Bearer <token>`

#### Update Profile
- **PUT** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: FormData with `username` and optional `profilePicture`

### Chat Endpoints

#### Create Chat
- **POST** `/api/chats`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ user2Id }`

#### Get User Chats
- **GET** `/api/chats`
- **Headers**: `Authorization: Bearer <token>`

#### Get Chat Messages
- **GET** `/api/chats/:chatId/messages`
- **Headers**: `Authorization: Bearer <token>`

#### Get Unread Count
- **GET** `/api/chats/unread/count`
- **Headers**: `Authorization: Bearer <token>`

### Message Endpoints

#### Send Message
- **POST** `/api/messages`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ chatId, content, fileUrl, fileType, fileName }`

#### Mark Message as Read
- **PUT** `/api/messages/:messageId/read`
- **Headers**: `Authorization: Bearer <token>`

#### Mark Chat Messages as Read
- **PUT** `/api/messages/chat/:chatId/read-all`
- **Headers**: `Authorization: Bearer <token>`

#### Upload File
- **POST** `/api/messages/upload`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: FormData with `file`

## Socket.IO Events

### Client to Server
- `user:online` - User comes online (send token)
- `message:send` - Send a message
- `message:read` - Mark message as read
- `typing:start` - Start typing
- `typing:stop` - Stop typing

### Server to Client
- `user:status-change` - User status updated
- `message:new` - New message received
- `message:sent` - Message sent confirmation
- `message:read-receipt` - Message read receipt
- `typing:indicator` - User typing indicator

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  profilePicture VARCHAR(255),
  status ENUM('online', 'offline', 'away') DEFAULT 'offline',
  lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Chats Table
```sql
CREATE TABLE Chats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1Id INT NOT NULL,
  user2Id INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat (user1Id, user2Id),
  FOREIGN KEY (user1Id) REFERENCES Users(id),
  FOREIGN KEY (user2Id) REFERENCES Users(id)
);
```

### Messages Table
```sql
CREATE TABLE Messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  chatId INT NOT NULL,
  senderId INT NOT NULL,
  content TEXT,
  fileUrl VARCHAR(255),
  fileType VARCHAR(50),
  fileName VARCHAR(255),
  isRead BOOLEAN DEFAULT FALSE,
  readAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chatId) REFERENCES Chats(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES Users(id)
);
```

## Features Deep Dive

### Real-Time Messaging
Messages are sent through Socket.IO with instant delivery and read receipts.

### Online/Offline Status
User status updates in real-time when they connect or disconnect.

### Typing Indicators
When a user starts typing, all other users in the chat see the typing indicator.

### File Sharing
Files are uploaded via Multer and stored in the `uploads` directory with URLs sent through messages.

### Message Persistence
All messages are stored in MySQL and can be retrieved when users reconnect.

## Security Features

- ✅ JWT token-based authentication
- ✅ bcryptjs password hashing (10 rounds)
- ✅ Protected API routes with middleware
- ✅ CORS configuration
- ✅ File upload validation
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection

## Deployment Guide

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - OS: Ubuntu 20.04
   - Instance: t2.micro or higher

2. **Install Dependencies**
```bash
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx
```

3. **Setup MySQL**
```bash
sudo mysql_secure_installation
mysql -u root -p < schema.sql
```

4. **Clone Repository**
```bash
git clone <repo-url>
cd real-time-chat-application
```

5. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Update .env with production values
npm run db:sync
npm start
```

6. **Frontend Build**
```bash
cd frontend
npm install
npm run build
```

7. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000/api;
    }
}
```

8. **SSL Certificate** (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secure_password
DB_NAME=chat_app
DB_PORT=3306
JWT_SECRET=very_long_random_string_here
JWT_EXPIRE=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CLIENT_URL=https://your-domain.com
```

### Frontend (.env.local)
```env
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=https://your-domain.com
```

## Performance Optimization

- Database indexing on frequently queried fields
- Connection pooling in MySQL
- Gzip compression on responses
- CDN for static assets
- Message pagination
- Socket.IO connection pooling

## Future Enhancements

- Group chats
- End-to-end encryption
- Voice/Video calls
- Message search
- Chat history export
- User blocking
- Message reactions
- Status updates with emojis
- Dark mode
- Multiple device support

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists

### Socket.IO Connection Issues
- Check CORS configuration
- Verify backend and frontend URLs match
- Clear browser cache and reconnect

### File Upload Errors
- Check file permissions on uploads directory
- Verify MAX_FILE_SIZE limit
- Ensure disk space is available

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Author

Created with ❤️ for real-time communication

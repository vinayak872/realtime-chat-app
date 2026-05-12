# Architecture & Design Patterns

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│                                                             │
│  React.js Application (Vite)                              │
│  ├── Pages (Login, Register, Home)                        │
│  ├── Components (ChatList, ChatWindow, MessageList)       │
│  ├── Context (Auth, Chat state management)                │
│  ├── Services (API calls, Socket.IO client)               │
│  └── Tailwind CSS (Responsive UI)                         │
└──────────┬──────────────────────────────────────────────────┘
           │ HTTP + WebSocket
           │
┌──────────▼──────────────────────────────────────────────────┐
│              EXPRESS.JS SERVER (Node.js)                    │
│                                                             │
│  Routes (Auth, Chat, Message)                             │
│  ├── authRoutes.js (Register, Login, Profile)            │
│  ├── chatRoutes.js (Create Chat, Get Messages)           │
│  └── messageRoutes.js (Send, Read, Upload)               │
│                                                             │
│  Controllers (Business Logic)                             │
│  ├── authController.js                                   │
│  ├── chatController.js                                   │
│  └── messageController.js                                │
│                                                             │
│  Socket.IO Handler                                        │
│  ├── Real-time messaging                                 │
│  ├── Typing indicators                                   │
│  ├── Status updates                                      │
│  └── Read receipts                                       │
│                                                             │
│  Middleware                                               │
│  ├── JWT Authentication (verifyToken)                    │
│  ├── Error Handling                                      │
│  └── File Upload (Multer)                                │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                   SEQUELIZE ORM                             │
│                                                             │
│  Models                                                    │
│  ├── User (id, username, email, password, status)        │
│  ├── Chat (id, user1Id, user2Id)                         │
│  └── Message (id, chatId, senderId, content, fileUrl)    │
│                                                             │
│  Associations                                             │
│  ├── User hasMany Chat                                   │
│  ├── Chat hasMany Message                                │
│  └── Message belongsTo User (sender)                     │
└──────────┬──────────────────────────────────────────────────┘
           │ SQL Queries
           │
┌──────────▼──────────────────────────────────────────────────┐
│                   MYSQL DATABASE                            │
│                                                             │
│  Tables: Users, Chats, Messages                          │
│  Indexes: chatId, senderId, composite keys               │
│  Relationships: Foreign keys with constraints             │
└─────────────────────────────────────────────────────────────┘
```

## Design Patterns Used

### 1. MVC Pattern
- **Models**: Sequelize models (User, Chat, Message)
- **Views**: React components (ChatList, ChatWindow, etc.)
- **Controllers**: authController, chatController, messageController

### 2. Context API for State Management
```javascript
// AuthContext
- Manages user authentication state
- Stores JWT token
- Provides login/logout functions

// ChatContext
- Manages current chat state
- Stores messages list
- Manages online users
- Tracks typing indicators
```

### 3. Repository Pattern
The controllers act as repositories:
```javascript
// authController provides methods for user operations
export const register = async (req, res) => { ... }
export const login = async (req, res) => { ... }
export const getProfile = async (req, res) => { ... }
```

### 4. Middleware Pattern
```javascript
// Authentication middleware
verifyToken() - Validates JWT token

// Error handling middleware
errorHandler() - Centralized error processing

// File upload middleware
upload.single('file') - Validates file uploads
```

### 5. Observer Pattern (Socket.IO)
```javascript
// Server emits events
io.emit('message:new', message)
io.emit('user:status-change', status)

// Clients listen to events
socket.on('message:new', handleNewMessage)
socket.on('user:status-change', updateStatus)
```

## Data Flow Diagram

### Message Sending Flow
```
User Types Message
        ↓
Frontend: MessageInput Component
        ↓
Emit: message:send via Socket.IO
        ↓
Backend: socketHandler receives event
        ↓
Create: Message in database via Sequelize
        ↓
Broadcast: message:new to recipient
        ↓
Frontend: MessageList receives new message
        ↓
UI: Message appears in chat
```

### Authentication Flow
```
User submits form (email, password)
        ↓
Frontend: POST /api/auth/login
        ↓
Backend: authController.login()
        ↓
Verify: password with bcryptjs
        ↓
Generate: JWT token
        ↓
Frontend: Store token in localStorage
        ↓
Set: Authorization header for future requests
        ↓
Access: Protected routes
```

### Real-time Status Update Flow
```
User connects browser
        ↓
Socket.IO: emit('user:online', token)
        ↓
Backend: verify token & update User.status = 'online'
        ↓
Database: Update Users table
        ↓
Broadcast: io.emit('user:status-change')
        ↓
All Clients: Receive status update
        ↓
UI: Show user as online (🟢)
```

## Error Handling Strategy

```javascript
// Global error handler in middleware
errorHandler(err, req, res, next) {
  // Categorize errors
  - ValidationError → 400
  - UniqueConstraintError → 400
  - AuthenticationError → 401
  - AuthorizationError → 403
  - NotFoundError → 404
  - ServerError → 500
  
  // Return consistent JSON response
  res.status(code).json({ message: err.message })
}
```

## Security Architecture

```
Request Flow Security:
1. CORS Validation (express-cors middleware)
   ├─ Checks origin matches CLIENT_URL
   └─ Allows credentials

2. JWT Verification (verifyToken middleware)
   ├─ Extract token from Authorization header
   ├─ Verify signature with JWT_SECRET
   └─ Attach decoded user info to request

3. Input Validation (controllers)
   ├─ Check required fields
   ├─ Validate email format
   ├─ Verify password strength
   └─ Check file types/sizes

4. Database Query Parameterization (Sequelize)
   ├─ Prevents SQL injection
   └─ Uses prepared statements

5. Password Hashing (bcryptjs)
   ├─ 10 rounds of salting
   ├─ One-way encryption
   └─ Constant time comparison
```

## Scalability Considerations

### Current Architecture
- Single server instance
- Local file storage
- In-memory Socket.IO connections
- Direct database queries

### For Scaling to Multiple Servers
```javascript
// 1. Redis adapter for Socket.IO
io.adapter(require('socket.io-redis'));

// 2. Session storage
- Use Redis instead of in-memory
- Share sessions across servers

// 3. File storage
- Move uploads to AWS S3
- Use CDN for static files

// 4. Database optimization
- Add read replicas
- Implement connection pooling
- Use caching (Redis)

// 5. Load balancing
- Use Nginx reverse proxy
- Sticky sessions for WebSocket
- Health checks on endpoints
```

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization with compression
- Lazy loading messages (pagination)
- Debouncing typing indicator events

### Backend
- Database indexing on frequently queries
- Message pagination (limit 50 per query)
- Connection pooling (max 10, min 0)
- Gzip compression on responses

### Network
- HTTP/2 for multiplexing
- WebSocket for real-time
- File compression
- CDN for static assets

## Deployment Architecture

```
┌─────────────────────────────────────┐
│     CloudFront (CDN)                │
│  Frontend static files              │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│     Application Load Balancer       │
│  Route to backend servers           │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐  ┌────▼────────────┐
│  EC2 Instance  │  │  EC2 Instance   │
│  Node.js App   │  │  Node.js App    │
│  Backend       │  │  Backend        │
└───────┬────────┘  └────┬────────────┘
        │                │
        └────────┬───────┘
                 │
        ┌────────▼──────────┐
        │   AWS RDS MySQL   │
        │   Multi-AZ        │
        │   Automated       │
        │   Backups         │
        └───────────────────┘

Additional Services:
- S3 for file uploads
- CloudWatch for monitoring
- Route53 for DNS
- Secrets Manager for credentials
```

## Caching Strategy

```javascript
// Message caching (Redis)
- Key: `messages:chatId:page`
- TTL: 1 hour
- Invalidate on new message

// User caching
- Key: `user:userId`
- TTL: 30 minutes
- Invalidate on profile update

// Chat list caching
- Key: `chats:userId`
- TTL: 5 minutes
- Invalidate on new chat
```

## Database Query Optimization

```sql
-- Instead of N+1 queries:
SELECT * FROM Chats WHERE user1Id = ? OR user2Id = ?;
SELECT * FROM Users WHERE id = ?; -- for each chat

-- Use JOIN with eager loading:
SELECT c.*, u1.*, u2.* FROM Chats c
JOIN Users u1 ON c.user1Id = u1.id
JOIN Users u2 ON c.user2Id = u2.id
WHERE c.user1Id = ? OR c.user2Id = ?;
```

This represents a production-ready, scalable architecture!

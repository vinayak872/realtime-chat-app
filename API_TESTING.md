# API Testing with cURL and Postman

## Base URL
```
http://localhost:5000/api
```

## Authentication

All endpoints (except register/login) require JWT token in header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": null,
    "status": "offline"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:** Same as register

### 3. Get Profile

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": null,
    "status": "online",
    "lastSeen": "2024-05-12T10:30:00.000Z"
  }
}
```

### 4. Get All Users

```bash
curl -X GET http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "id": 2,
      "username": "jane_doe",
      "email": "jane@example.com",
      "profilePicture": null,
      "status": "online",
      "lastSeen": "2024-05-12T10:35:00.000Z"
    }
  ]
}
```

### 5. Create Chat

```bash
curl -X POST http://localhost:5000/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user2Id": 2
  }'
```

**Response:**
```json
{
  "message": "Chat created successfully",
  "chat": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "createdAt": "2024-05-12T10:30:00.000Z",
    "updatedAt": "2024-05-12T10:30:00.000Z"
  }
}
```

### 6. Get User Chats

```bash
curl -X GET http://localhost:5000/api/chats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "chats": [
    {
      "id": 1,
      "otherUser": {
        "id": 2,
        "username": "jane_doe",
        "email": "jane@example.com",
        "status": "online"
      },
      "lastMessage": {
        "id": 5,
        "content": "Hello!",
        "createdAt": "2024-05-12T10:35:00.000Z"
      },
      "updatedAt": "2024-05-12T10:35:00.000Z"
    }
  ]
}
```

### 7. Get Chat Messages

```bash
curl -X GET http://localhost:5000/api/chats/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "chatId": 1,
      "senderId": 1,
      "content": "Hi there!",
      "fileUrl": null,
      "isRead": true,
      "readAt": "2024-05-12T10:31:00.000Z",
      "createdAt": "2024-05-12T10:30:00.000Z",
      "sender": {
        "id": 1,
        "username": "john_doe"
      }
    }
  ]
}
```

### 8. Send Message (via Socket.IO)

```javascript
// In browser console or Node.js
socket.emit('message:send', {
  chatId: 1,
  content: 'Hello Jane!',
  fileUrl: null,
  fileType: null,
  fileName: null
});
```

### 9. Mark Message as Read

```bash
curl -X PUT http://localhost:5000/api/messages/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Message marked as read",
  "data": {
    "id": 1,
    "isRead": true,
    "readAt": "2024-05-12T10:31:00.000Z"
  }
}
```

### 10. Mark Chat Messages as Read

```bash
curl -X PUT http://localhost:5000/api/messages/chat/1/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Chat messages marked as read"
}
```

### 11. Upload File

```bash
curl -X POST http://localhost:5000/api/messages/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.jpg"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "fileUrl": "/uploads/1234567890-file.jpg",
  "fileName": "file.jpg",
  "fileType": "image/jpeg"
}
```

### 12. Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "username=new_username" \
  -F "profilePicture=@/path/to/avatar.jpg"
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "new_username",
    "email": "john@example.com",
    "profilePicture": "/uploads/avatar.jpg",
    "status": "online"
  }
}
```

## Socket.IO Events

### Listen for new message

```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // {
  //   id: 1,
  //   chatId: 1,
  //   senderId: 2,
  //   content: "Hi!",
  //   createdAt: "2024-05-12T10:30:00.000Z",
  //   isRead: false
  // }
});
```

### Listen for message read receipt

```javascript
socket.on('message:read-receipt', (data) => {
  console.log('Message read:', data);
  // { messageId: 1, chatId: 1 }
});
```

### Listen for user status change

```javascript
socket.on('user:status-change', (data) => {
  console.log('User status changed:', data);
  // { userId: 2, status: 'online' }
});
```

### Listen for typing indicator

```javascript
socket.on('typing:indicator', (data) => {
  console.log('User is typing:', data);
  // { chatId: 1, userId: 2, isTyping: true }
});
```

## Error Responses

### 400 Bad Request

```json
{
  "message": "Email or username already exists"
}
```

### 401 Unauthorized

```json
{
  "message": "Invalid email or password"
}
```

### 403 Forbidden

```json
{
  "message": "Unauthorized access"
}
```

### 404 Not Found

```json
{
  "message": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

## Postman Collection

Import this collection into Postman:

```json
{
  "info": {
    "name": "Chat Application API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{BASE_URL}}/auth/register"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{BASE_URL}}/auth/login"
          }
        }
      ]
    },
    {
      "name": "Chats",
      "item": [
        {
          "name": "Get Chats",
          "request": {
            "method": "GET",
            "url": "{{BASE_URL}}/chats",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{TOKEN}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Testing Tips

1. **Set environment variable** in Postman:
   - BASE_URL: http://localhost:5000/api
   - TOKEN: <your_jwt_token>

2. **Test Socket.IO events** using:
   - Chrome DevTools Console
   - Socket.IO Client testing tools
   - Postman (limited support)

3. **Monitor requests**:
   - Use Network tab in DevTools
   - Check backend logs for errors
   - Review Socket.IO connections in server logs

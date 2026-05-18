# Database Access Guide

## Database Location

**SQLite Database File:**
```
/Users/vinayakkumar/real-time-chat-application/backend/data/chat_app.db
```

## Database Type

The application uses **SQLite** for development (lightweight, file-based database stored as a single file).

## How to View Registered Users and Data

### **Option 1: Using SQLite CLI (Command Line)**

1. **Open terminal** and navigate to the backend directory:
```bash
cd /Users/vinayakkumar/real-time-chat-application/backend
```

2. **Open the SQLite database**:
```bash
sqlite3 data/chat_app.db
```

3. **View all registered users**:
```sql
SELECT id, username, email, status, createdAt FROM User;
```

4. **View specific user details** (including when they registered):
```sql
SELECT * FROM User WHERE username = 'your_username';
```

5. **View all chats**:
```sql
SELECT * FROM Chat;
```

6. **View all messages**:
```sql
SELECT * FROM Message;
```

7. **Exit SQLite**:
```sql
.quit
```

### **Option 2: Using SQLite Browser GUI (Recommended for easy viewing)**

1. **Download SQLite Browser** from: https://sqlitebrowser.org/

2. **Install it** on your Mac

3. **Open the database file**:
   - Launch SQLite Browser
   - Click "Open Database"
   - Navigate to: `/Users/vinayakkumar/real-time-chat-application/backend/data/chat_app.db`
   - Click Open

4. **Browse the data**:
   - Click on "Browse Data" tab
   - Select table from dropdown:
     - **User** - View all registered users
     - **Chat** - View all chat conversations
     - **Message** - View all messages

### **Option 3: Using VS Code SQLite Extension**

1. **Install extension**: Search for "SQLite" in VS Code Extensions
   - Install "SQLite" by alexcvzz

2. **Open database**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Search for "SQLite: Open Database"
   - Select the database file at `backend/data/chat_app.db`

3. **View data**:
   - The database will appear in the explorer
   - Click on tables to view data
   - Run custom SQL queries

## Database Tables

### **User Table**
Stores registered user information:
```
- id (INTEGER, PRIMARY KEY)
- username (STRING, UNIQUE)
- email (STRING, UNIQUE)
- password (STRING - encrypted with bcryptjs)
- profilePicture (STRING - optional profile image URL)
- status (ENUM: 'online', 'offline', 'away')
- lastSeen (DATE)
- createdAt (DATE)
- updatedAt (DATE)
```

### **Chat Table**
Stores chat conversations between users:
```
- id (INTEGER, PRIMARY KEY)
- user1Id (INTEGER - foreign key to User)
- user2Id (INTEGER - foreign key to User)
- createdAt (DATE)
- updatedAt (DATE)
```

### **Message Table**
Stores individual messages:
```
- id (INTEGER, PRIMARY KEY)
- chatId (INTEGER - foreign key to Chat)
- senderId (INTEGER - foreign key to User)
- content (TEXT - message body)
- isRead (BOOLEAN)
- readAt (DATE - timestamp when read)
- createdAt (DATE)
- updatedAt (DATE)
```

## Example SQL Queries

### View all registered users with count:
```sql
SELECT COUNT(*) as total_users FROM User;
```

### View users with their registration date:
```sql
SELECT username, email, status, datetime(createdAt) as registered_on FROM User ORDER BY createdAt DESC;
```

### View all chats with user details:
```sql
SELECT c.id, 
       u1.username as user1, 
       u2.username as user2, 
       datetime(c.createdAt) as created_at
FROM Chat c
JOIN User u1 ON c.user1Id = u1.id
JOIN User u2 ON c.user2Id = u2.id;
```

### View all messages in a specific chat:
```sql
SELECT m.id, 
       u.username as sender, 
       m.content, 
       m.isRead, 
       datetime(m.createdAt) as sent_at
FROM Message m
JOIN User u ON m.senderId = u.id
WHERE m.chatId = 1
ORDER BY m.createdAt;
```

### Search for a specific user:
```sql
SELECT id, username, email, status FROM User WHERE email LIKE '%example.com%';
```

### Count total messages per user:
```sql
SELECT u.username, COUNT(m.id) as total_messages
FROM User u
LEFT JOIN Message m ON u.id = m.senderId
GROUP BY u.id, u.username;
```

## Resetting the Database

To delete all data and start fresh:

```bash
# Remove the database file
rm /Users/vinayakkumar/real-time-chat-application/backend/data/chat_app.db

# Then restart the server (it will recreate an empty database)
npm start
```

## Database File Details

- **File Path**: `backend/data/chat_app.db`
- **File Type**: SQLite 3 Database
- **Grows with**: Each new user registration, message sent, and chat created
- **Storage**: Local machine (persists even after app restart)
- **Size**: Increases gradually as data accumulates

## Backup Your Database

To backup your database:

```bash
# Copy the database file
cp /Users/vinayakkumar/real-time-chat-application/backend/data/chat_app.db \
   /Users/vinayakkumar/real-time-chat-application/backend/data/chat_app_backup.db
```

---

**Summary**: The database is a file-based SQLite database located at `backend/data/chat_app.db`. You can view registered users and all data using SQLite CLI, SQLite Browser, or VS Code extensions. All user registration, messages, and chat data is stored in this single file.

# Database Schema

## Users Table

Stores user account information and authentication data.

```sql
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profilePicture` varchar(255) COLLATE utf8mb4_unicode_ci,
  `status` enum('online','offline','away') COLLATE utf8mb4_unicode_ci DEFAULT 'offline',
  `lastSeen` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Chats Table

Stores one-to-one chat relationships between users.

```sql
CREATE TABLE `Chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1Id` int NOT NULL,
  `user2Id` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat` (`user1Id`,`user2Id`),
  KEY `user2Id` (`user2Id`),
  CONSTRAINT `Chats_ibfk_1` FOREIGN KEY (`user1Id`) REFERENCES `Users` (`id`),
  CONSTRAINT `Chats_ibfk_2` FOREIGN KEY (`user2Id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Messages Table

Stores all messages in the application with read status.

```sql
CREATE TABLE `Messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatId` int NOT NULL,
  `senderId` int NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `fileUrl` varchar(255) COLLATE utf8mb4_unicode_ci,
  `fileType` varchar(50) COLLATE utf8mb4_unicode_ci,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci,
  `isRead` tinyint(1) DEFAULT '0',
  `readAt` datetime,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatId` (`chatId`),
  KEY `senderId` (`senderId`),
  CONSTRAINT `Messages_ibfk_1` FOREIGN KEY (`chatId`) REFERENCES `Chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Messages_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Important Indexes

For optimal performance, these indexes are automatically created:

```sql
-- For fast message lookup by chat
CREATE INDEX idx_messages_chatId ON Messages(chatId);

-- For fast message lookup by sender
CREATE INDEX idx_messages_senderId ON Messages(senderId);

-- For fast unread message lookup
CREATE INDEX idx_messages_read_status ON Messages(isRead, chatId);

-- For fast chat lookup
CREATE INDEX idx_chats_composite ON Chats(user1Id, user2Id);
```

## Relationships

```
User
  ├── has many initiatedChats (as user1)
  ├── has many receivedChats (as user2)
  └── has many sentMessages

Chat
  ├── belongs to user1
  ├── belongs to user2
  └── has many Messages

Message
  ├── belongs to Chat
  └── belongs to Sender (User)
```

## Sample Queries

### Get all chats for a user with latest message

```sql
SELECT 
    c.id,
    CASE 
        WHEN c.user1Id = ? THEN u2.id
        ELSE u1.id
    END as otherUserId,
    CASE 
        WHEN c.user1Id = ? THEN u2.username
        ELSE u1.username
    END as otherUsername,
    CASE 
        WHEN c.user1Id = ? THEN u2.profilePicture
        ELSE u1.profilePicture
    END as profilePicture,
    (SELECT m.content FROM Messages m WHERE m.chatId = c.id ORDER BY m.createdAt DESC LIMIT 1) as lastMessage,
    (SELECT m.createdAt FROM Messages m WHERE m.chatId = c.id ORDER BY m.createdAt DESC LIMIT 1) as lastMessageTime
FROM Chats c
JOIN Users u1 ON c.user1Id = u1.id
JOIN Users u2 ON c.user2Id = u2.id
WHERE c.user1Id = ? OR c.user2Id = ?
ORDER BY lastMessageTime DESC;
```

### Get unread message count per chat

```sql
SELECT 
    c.id as chatId,
    COUNT(m.id) as unreadCount
FROM Chats c
LEFT JOIN Messages m ON c.id = m.chatId AND m.isRead = 0
WHERE (c.user1Id = ? OR c.user2Id = ?) 
    AND m.senderId != ?
GROUP BY c.id
HAVING COUNT(m.id) > 0;
```

### Get messages for a chat with sender info

```sql
SELECT 
    m.id,
    m.chatId,
    m.senderId,
    u.username,
    u.profilePicture,
    m.content,
    m.fileUrl,
    m.fileType,
    m.fileName,
    m.isRead,
    m.readAt,
    m.createdAt
FROM Messages m
JOIN Users u ON m.senderId = u.id
WHERE m.chatId = ?
ORDER BY m.createdAt ASC;
```

## Data Types Reference

| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | Primary key |
| username | VARCHAR(50) | Unique, case-sensitive |
| email | VARCHAR(100) | Unique, validated |
| password | VARCHAR(255) | Hashed with bcryptjs |
| profilePicture | VARCHAR(255) | URL to uploaded image |
| status | ENUM | one of: online, offline, away |
| content | LONGTEXT | Supports emoji and special chars |
| fileUrl | VARCHAR(255) | Relative path to uploaded file |
| isRead | TINYINT(1) | Boolean (0/1) |
| timestamps | DATETIME | Auto-managed |

## Migration Notes

When updating schema:

1. Always use ALTER TABLE for production
2. Add new columns with DEFAULT values
3. Create indexes before they're needed
4. Test migrations on staging first
5. Keep backups before schema changes

Example migration:

```sql
ALTER TABLE Users 
ADD COLUMN bio VARCHAR(255) DEFAULT '' AFTER profilePicture;

ALTER TABLE Chats 
ADD COLUMN isArchived TINYINT(1) DEFAULT 0;

CREATE INDEX idx_users_status ON Users(status);
```

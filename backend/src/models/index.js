import User from './User.js';
import Chat from './Chat.js';
import Message from './Message.js';

// User associations
User.hasMany(Chat, { as: 'initiatedChats', foreignKey: 'user1Id' });
User.hasMany(Chat, { as: 'receivedChats', foreignKey: 'user2Id' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });

// Chat associations
Chat.belongsTo(User, { as: 'user1', foreignKey: 'user1Id' });
Chat.belongsTo(User, { as: 'user2', foreignKey: 'user2Id' });
Chat.hasMany(Message, { as: 'messages', foreignKey: 'chatId', onDelete: 'CASCADE' });

// Message associations
Message.belongsTo(Chat, { as: 'chat', foreignKey: 'chatId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

export { User, Chat, Message };

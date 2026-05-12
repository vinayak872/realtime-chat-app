import sequelize from '../config/database.js';
import { User, Chat, Message } from '../models/index.js';

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

export default syncDatabase;

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Use SQLite for development, MySQL for production
const isDevelopment = process.env.NODE_ENV === 'development';

let sequelize;

if (isDevelopment || process.env.DB_DIALECT === 'sqlite') {
  // Development: Use SQLite
  const dbPath = path.resolve('./data/chat_app.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
  console.log(`📦 Using SQLite database at: ${dbPath}`);
} else {
  // Production: Use MySQL
  sequelize = new Sequelize(
    process.env.DB_NAME || 'chat_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
  console.log(`📦 Using MySQL database`);
}

export default sequelize;

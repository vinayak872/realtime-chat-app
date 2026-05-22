import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();


// Use SQLite for development, PostgreSQL for production
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
  // Production: Use PostgreSQL
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
  console.log(`📦 Using PostgreSQL database`);
}

export default sequelize;

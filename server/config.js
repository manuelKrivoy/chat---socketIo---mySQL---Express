import dotenv from 'dotenv';
import mysql from 'mysql2';


dotenv.config();
export const connection = mysql.createConnection({
  host: process.env.HOST,
  port: process.env.DATABASE_PORT,
  user: 'cursosql',
  password: 'qwert123',
  database: 'chat'
});

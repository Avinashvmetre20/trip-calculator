import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL');
}

const pool = new Pool({
  connectionString,
});

export default pool;

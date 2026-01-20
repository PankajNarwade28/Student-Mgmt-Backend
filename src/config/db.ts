// config/db.ts
import { Pool } from "pg";

// dotenv is already loaded in server.ts before this module is imported
console.log('[DB] DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };

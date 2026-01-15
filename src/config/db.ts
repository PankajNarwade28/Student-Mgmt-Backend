import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
 

// The pool automatically picks up the connectionString from process.env
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
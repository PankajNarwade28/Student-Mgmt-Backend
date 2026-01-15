import { pool } from '../config/db';

export class HealthRepository {
  async isDatabaseHealthy(): Promise<boolean> {
    try {
      // Production-style raw SQL check
      await pool.query('SELECT 1 FROM students LIMIT 1'); 
      return true;
    } catch (error) {
      return false;
    }
  }
}
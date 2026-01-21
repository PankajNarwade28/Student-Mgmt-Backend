import { injectable } from 'inversify';
import { pool } from "../config/db";

@injectable()
export class HealthRepository {
  async isDatabaseHealthy(): Promise<boolean> {
    try {
      await pool.query("SELECT 1"); // trivial query to check connectivity
      return true;
    } catch (error: any) {
      console.error("Database health check error:", error);
      throw error; // bubble up original error
    }
  }
}

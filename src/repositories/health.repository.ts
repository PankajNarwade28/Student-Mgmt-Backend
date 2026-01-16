import { pool } from "../config/db";
// HealthRepository.ts
export class HealthRepository {
  async isDatabaseHealthy(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await pool.query('SELECT 1'); 
      return { healthy: true }; 
    } catch (error: any) {
      console.error("Database health check error:", error);
      // Return the specific PG error message
      return { healthy: false, error: error.message }; 
    }
  }
}
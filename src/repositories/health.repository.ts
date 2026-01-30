import { inject, injectable } from 'inversify'; 
import { Pool } from 'pg';
import { TYPES } from '../config/types';

@injectable()
export class HealthRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}
  async isDatabaseHealthy(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1"); // trivial query to check connectivity
      return true;
    } catch (error: any) {
      console.error("Database health check error:", error);
      throw error; // bubble up original error
    }
  }
}

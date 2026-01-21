import { injectable, inject } from 'inversify';
import { Pool } from 'pg'; // Import the type for the pool
import { TYPES } from '../config/types';

@injectable()
export class StudentRepository {
  // Inject the database pool directly
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  async getTotalStudentCount(): Promise<number> {
    const queryText = 'SELECT COUNT(*) AS total FROM users';

    try {
      const { rows } = await this.pool.query<{ total: string }>(queryText);
      const count = rows[0]?.total ?? '0';
      return parseInt(count, 10);
    } catch (error: any) {
      console.error("Database error:", error);
      throw error;
    }
  }
}
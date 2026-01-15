import { pool } from '../config/db'; // Your connection pool

export class StudentRepository {
  async getTotalStudentCount(): Promise<number> {
    try {
      // Use Raw SQL as required by project constraints
      const result = await pool.query('SELECT COUNT(*) FROM students');
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error("Database error while counting students:", error);
      return 0;
    }
  }
}
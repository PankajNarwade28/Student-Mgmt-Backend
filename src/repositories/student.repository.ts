import { pool } from '../config/db';

export class StudentRepository {

async getTotalStudentCount(): Promise<number> {
  const queryText = 'SELECT COUNT(*) AS total FROM students'; // Typo here

  try {
    const { rows } = await pool.query<{ total: string }>(queryText);
    const count = rows[0]?.total ?? '0';
    return parseInt(count, 10);
  } catch (error: any) {
  console.error("Database error:", error);
  throw error; // preserve the original error object
}
}
}


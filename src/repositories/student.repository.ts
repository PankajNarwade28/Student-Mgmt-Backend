// import { pool } from '../config/db'; // Your connection pool

// export class StudentRepository {
//   async getTotalStudentCount(): Promise<number> {
//     try {
//       // Use Raw SQL as required by project constraints
//       const result = await pool.query('SELECT COUNT(*) FROM sstudents');
//       return parseInt(result.rows[0].count, 10);
//     } catch (error) {
//       console.error("Database error while counting students:", error);
//       // Handle error appropriately, maybe rethrow or return a default value
//       return 0;
//     }
//   }
// }
import { pool } from '../config/db';

export class StudentRepository {
  /**
   * Optimized: Uses explicit return types and precise error handling.
   * Returns the total count of students or throws an error for the service layer to catch.
   */ 
async getTotalStudentCount(): Promise<number> {
  const queryText = 'SELECT COUNT(*) AS total FROM students'; // Typo here

  try {
    const { rows } = await pool.query<{ total: string }>(queryText);
    const count = rows[0]?.total ?? '0';
    return parseInt(count, 10);
  } catch (error: any) {
    console.error("Database error:", error);
    // DO NOT return 0 here. Throw the error so the API can catch it.
    throw new Error(error.message || "Database Query Failed");
  }
}
}


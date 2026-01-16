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
    const queryText = 'SELECT COUNT(*) AS total FROM students';

    try {
      const { rows } = await pool.query<{ total: string }>(queryText);
      
      // result.rows[0] is guaranteed to exist for COUNT(*), 
      // but we use nullish coalescing for extra safety.
      const count = rows[0]?.total ?? '0';
      
      return parseInt(count, 10);
    } catch (error) {
  // 1. You log the error to the console for the developer to see
  console.error("Database error:", error); 
  
  // 2. You "rethrow" the error so the server knows something went wrong
  throw new Error("Database Error: Table not found"); 
}
  }
}
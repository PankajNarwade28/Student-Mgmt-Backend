// src/repositories/request.repository.ts
import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";

@injectable()
export class RequestRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // Fetch detailed requests with joined names
  //   async getAllDetailedRequests() {
  //   // Check your DB: if the column is actually 'created_at', change it here
  //   const query = `
  //     SELECT
  //       r.id,
  //       r.student_id,
  //       r.course_id,
  //       r.requested_at, -- Ensure this matches your DB exactly
  //       p.first_name || ' ' || p.last_name as student_name,
  //       u.email as student_email,
  //       c.name as course_name
  //     FROM enrollment_requests r
  //     JOIN users u ON r.student_id = u.id
  //     LEFT JOIN profiles p ON u.id = p.user_id
  //     JOIN courses c ON r.course_id = c.id
  //     ORDER BY r.requested_at DESC;
  //   `;
  //   const result = await this.pool.query(query);
  //   return result.rows;
  // }

  async getAllDetailedRequests(limit: number, offset: number) {
    const dataQuery = `
    SELECT 
      r.id, 
      r.student_id, 
      r.course_id, 
      r.requested_at,
      p.first_name || ' ' || p.last_name as student_name,
      u.email as student_email,
      c.name as course_name
    FROM enrollment_requests r
    JOIN users u ON r.student_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    JOIN courses c ON r.course_id = c.id
    ORDER BY r.requested_at DESC
    LIMIT $1 OFFSET $2; 
  `;

    const countQuery = `SELECT COUNT(*) FROM enrollment_requests`;

    const [dataRes, countRes] = await Promise.all([
      this.pool.query(dataQuery, [limit, offset]),
      this.pool.query(countQuery),
    ]);

    return {
      requests: dataRes.rows,
      totalCount: Number.parseInt(countRes.rows[0].count),
    };
  }

  // Handle Rejection: Simply delete the request
  async rejectAndDelete(requestId: number) {
    const query = "DELETE FROM enrollment_requests WHERE id = $1";
    await this.pool.query(query, [requestId]);
  }

  // src/repositories/request.repository.ts

  async acceptAndEnroll(
    requestId: number,
    studentId: string,
    courseId: number,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Check for existing enrollment to prevent duplicate key errors
      const checkQuery = `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2`;
      const existing = await client.query(checkQuery, [studentId, courseId]);

      if (existing.rows.length === 0) {
        // 2. Updated Insert: Including the status and timestamp columns seen in your table
        const enrollQuery = `
        INSERT INTO enrollments (student_id, course_id, status, enrolled_at) 
        VALUES ($1, $2, 'Active', NOW())
      `;
        await client.query(enrollQuery, [studentId, courseId]);
      }

      // 3. Delete the request regardless of whether they were already enrolled
      // This ensures the "inbox" is cleared
      await client.query("DELETE FROM enrollment_requests WHERE id = $1", [
        requestId,
      ]);

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Transaction Error:", err);
      throw err;
    } finally {
      client.release();
    }
  }
}

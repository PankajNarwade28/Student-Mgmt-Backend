import { inject } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";

export class EnrollmentRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // Fetches courses with their current students for the management grid
  async getEnrollmentDetails() {
    const query = `
      SELECT 
        c.id, c.name, c.code,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', p.user_id, 'name', CONCAT(p.first_name, ' ', p.last_name))
          ) FILTER (WHERE p.user_id IS NOT NULL), '[]'
        ) AS enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN profiles p ON e.student_id = p.user_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name ASC;
    `;
    const { rows } = await this.pool.query(query);
    return rows;
  }

  // Fetches active students for the assignment modal
  async getActiveStudentsList() {
    const query = `
      SELECT u.id, CONCAT(p.first_name, ' ', p.last_name) AS name 
      FROM users u 
      JOIN profiles p ON u.id = p.user_id 
      WHERE u.role = 'Student' AND u.is_active = true;
    `;
    const { rows } = await this.pool.query(query);
    return rows;
  }

  async addEnrollment(studentId: string, courseId: number) {
    const query = `
    INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
    VALUES ($1::uuid, $2, 'Active', CURRENT_TIMESTAMP) -- Changed from 'Enrolled' to 'Active'
    ON CONFLICT (student_id, course_id) DO NOTHING
    RETURNING *;
  `;
    const { rows } = await this.pool.query(query, [studentId, courseId]);
    return rows[0];
  }

  async removeEnrollment(studentId: string, courseId: number) {
    console.log(
      "Removing enrollment for Student ID:",
      studentId,
      "from Course ID:",
      courseId,
    );
    const query = `
    DELETE FROM enrollments 
    WHERE student_id = $1 AND course_id = $2
    RETURNING *;
  `;
    const { rows } = await this.pool.query(query, [studentId, courseId]);
    return rows[0];
  }

  /**
   * Fetches all student enrollment details for a specific course
   */
  // Inside EnrollmentRepository.ts
  async getEnrollmentsByCourse(courseId: number) {
    const query = `
    SELECT 
      e.id AS enrollment_id,
      u.id AS student_id,
      CONCAT(p.first_name, ' ', p.last_name) AS student_name,
      e.status
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE e.course_id = $1 
    -- Removed e.deleted_at IS NULL because the column doesn't exist
    ORDER BY student_name ASC;
  `;

    const { rows } = await this.pool.query(query, [courseId]);
    return rows;
  }

  // Inside EnrollmentRepository.ts
async updateEnrollmentStatus(enrollmentId: number, status: string, adminId: string) {
  const query = `
    UPDATE enrollments 
    SET 
      status = $2, 
      updated_by = $3::UUID, -- Explicitly cast to UUID
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;

  // Check your terminal: if adminId is undefined, the query will fail.
  const { rows } = await this.pool.query(query, [enrollmentId, status, adminId]);
  return rows[0];
}
}

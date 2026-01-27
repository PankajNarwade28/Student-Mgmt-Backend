import { Pool } from "pg";

export class EnrollmentRepository {
  constructor(private pool: Pool) {}

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
    console.log(
      "Adding enrollment for Student ID:",
      studentId,
      "to Course ID:",
      courseId,
    );
    const query = `
    INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
    VALUES ($1, $2, 'Enrolled', CURRENT_TIMESTAMP)
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
}

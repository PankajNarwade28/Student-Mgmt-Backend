// src/repositories/teacher.repository.ts
import { Pool } from "pg";

export class TeacherRepository {
  constructor(private pool: Pool) {}

  async getStudentsByCourse(courseId: number) {
    const query = `
      SELECT 
        e.id AS enrollment_id,
        u.id AS student_id,
        CONCAT(p.first_name, ' ', p.last_name) AS student_name,
        g.grade_value,
        g.remarks,
        g.updated_at
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN grades g ON e.id = g.enrollment_id
      WHERE e.course_id = $1
      ORDER BY p.first_name ASC;
    `;
    const { rows } = await this.pool.query(query, [courseId]);
    return rows;
  }

  async upsertGrade(enrollmentId: number, gradeValue: number, remarks: string, teacherId: string) {
    const query = `
      INSERT INTO grades (enrollment_id, grade_value, remarks, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (enrollment_id) 
      DO UPDATE SET 
        grade_value = EXCLUDED.grade_value,
        remarks = EXCLUDED.remarks,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [enrollmentId, gradeValue, remarks, teacherId]);
    console.log("Upserted grade:", rows[0]);
    return rows[0];
  }
}
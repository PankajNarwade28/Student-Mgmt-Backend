// src/repositories/teacher.repository.ts
import { Pool } from "pg";

export class TeacherRepository {
  constructor(private readonly pool: Pool) {}

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

  async upsertGrade(
    enrollmentId: number,
    gradeValue: number,
    remarks: string,
    teacherId: string,
  ) {
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
    const { rows } = await this.pool.query(query, [
      enrollmentId,
      gradeValue,
      remarks,
      teacherId,
    ]);
    console.log("Upserted grade:", rows[0]);
    return rows[0];
  }

  async upsertAnnouncement(
    courseId: string,
    title: string,
    content: string,
    type: string,
    teacherId: string,
  ) {
    const query = `
    INSERT INTO announcements (course_id, title, content, type, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    ON CONFLICT (id) 
    DO UPDATE SET 
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      type = EXCLUDED.type,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
    // The $5 parameter now maps to the 'created_by' column we just added
    const { rows } = await this.pool.query(query, [
      courseId,
      title,
      content,
      type,
      teacherId,
    ]);
    return rows[0];
  }

  async getAnnouncementsByCourse(courseId: string) {
    const query = `
    SELECT 
      id, 
      course_id, 
      title, 
      content, 
      type, 
      created_by, 
      created_at,
      updated_at
    FROM announcements 
    WHERE course_id = $1 
    ORDER BY created_at DESC;
  `;

    try {
      const { rows } = await this.pool.query(query, [courseId]);
      return rows;
    } catch (error: any) {
      console.error(
        "Database Error in getAnnouncementsByCourse:",
        error.message,
      );
      throw new Error("Could not retrieve course announcements");
    }
  }

  async getAnnouncementById(announcementId: number | string) {
    const query = `SELECT * FROM announcements WHERE id = $1;`;
    const { rows } = await this.pool.query(query, [announcementId]);
    return rows[0] || null;
  }

  async deleteAnnouncement(id: string | number) {
    const query = `
    DELETE FROM announcements 
    WHERE id = $1 
    RETURNING *;
  `;
    const { rows } = await this.pool.query(query, [id]);
    console.log("Delete query executed for ID:", id);
    if (rows.length === 0) {
      console.log("No announcement found with ID:", id);
      return null;
    }
    console.log("Deleted announcement:", rows[0]);
    return rows[0];
  }
}

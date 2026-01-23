import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";

@injectable()
export class CourseRepository {
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  // Fetch only active teachers for the dropdown
async getActiveTeachers() {
  const query = `
    SELECT 
      u.id, 
      u.email, 
      CASE 
        WHEN TRIM(CONCAT(p.first_name, ' ', p.last_name)) = '' THEN u.email
        ELSE CONCAT(p.first_name, ' ', p.last_name)
      END AS teacher_name
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.role = 'Teacher' AND u.is_active = true
  `;
  
  const { rows } = await this.pool.query(query);
  return rows; 
}

  // Create a new course
  async createCourse(data: any) {
    const query = `
      INSERT INTO courses (name, code, description, teacher_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const values = [data.name, data.code, data.description, data.teacher_id];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  // get count of courses assigned to a specific teacher
  async getCourseCountByTeacher(teacherId: string): Promise<number> {
    const query = `SELECT COUNT(*) FROM courses WHERE teacher_id = $1 AND deleted_at IS NULL`;
    const { rows } = await this.pool.query(query, [teacherId]);
    return parseInt(rows[0].count);
  }

  // Get all courses with teacher details
async getAllCourses() {
  const query = `
    SELECT 
      c.id, c.name, c.code, c.description, c.created_at, c.deleted_at,
      u.email AS teacher_email,
      CONCAT(p.first_name, ' ', p.last_name) AS teacher_name
    FROM courses c
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    ORDER BY c.deleted_at DESC NULLS LAST, c.created_at DESC
  `;
  const { rows } = await this.pool.query(query);
  return rows;
}
  // Soft delete a course
  async deleteCourse(courseId: number) {
    // Update the deleted_at timestamp instead of removing the row
    const query = `
    UPDATE courses 
    SET deleted_at = CURRENT_TIMESTAMP 
    WHERE id = $1
  `;
    await this.pool.query(query, [courseId]);
  }

  // Restore a soft-deleted course
  async restoreCourse(courseId: number) {
    const query = `UPDATE courses SET deleted_at = NULL WHERE id = $1`;
    await this.pool.query(query, [courseId]);
  }

  // Update course details
  async updateCourse(
    id: number,
    data: {
      name: string;
      code: string;
      description: string;
      teacher_id: string;
    },
  ) {
    const query = `
    UPDATE courses 
    SET name = $1, code = $2, description = $3, teacher_id = $4
    WHERE id = $5
    RETURNING *
  `;
    const values = [
      data.name,
      data.code,
      data.description,
      data.teacher_id,
      id,
    ];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }
}

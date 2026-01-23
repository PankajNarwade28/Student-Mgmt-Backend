import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";

@injectable()
export class CourseRepository {
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  // Fetch only active teachers for the dropdown
  async getActiveTeachers() {
    const query = `
    SELECT id, email FROM users 
    /* Changed 'Student' to 'Teacher' to match your database schema role */
    WHERE role = 'Teacher' AND is_active = true
  `;
    const { rows } = await this.pool.query(query); //
    console.log(rows); //
    return rows; //
  }

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

  // CourseRepository.ts
  async getCourseCountByTeacher(teacherId: string): Promise<number> {
    const query = `SELECT COUNT(*) FROM courses WHERE teacher_id = $1 AND deleted_at IS NULL`;
    const { rows } = await this.pool.query(query, [teacherId]);
    return parseInt(rows[0].count);
  }
}

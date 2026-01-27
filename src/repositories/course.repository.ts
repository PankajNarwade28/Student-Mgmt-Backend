import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";
import { pool } from "../config/db";

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

  // For Teachers/Admins: Get all active courses
  async getAllAvailableCourses() {
    const query = `
    SELECT 
      c.id, c.name, c.code, c.description, 
      CONCAT(p.first_name, ' ', p.last_name) AS teacher_name,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS student_count
    FROM courses c
    JOIN profiles p ON c.teacher_id = p.user_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `;
    const { rows } = await this.pool.query(query);
    return rows;
  }

  // For Teachers: Get only courses assigned to them
  async getCoursesByTeacher(teacherId: string) {
    const query = `
    SELECT 
      c.id, c.name, c.code, c.description, 
      CONCAT(p.first_name, ' ', p.last_name) AS teacher_name,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS student_count
    FROM courses c
    JOIN profiles p ON c.teacher_id = p.user_id
    WHERE c.teacher_id = $1 AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `;
    const { rows } = await this.pool.query(query, [teacherId]);
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

  // 2. For Students: Courses available to join (not yet enrolled)
  async getAvailableToEnroll(studentId: string) {
    const query = `
      SELECT 
        c.id, c.name, c.code, c.description,
        CONCAT(p.first_name, ' ', p.last_name) AS teacher_name
      FROM courses c
      JOIN profiles p ON c.teacher_id = p.user_id
      WHERE c.deleted_at IS NULL 
      AND c.id NOT IN (
        SELECT course_id FROM enrollments WHERE student_id = $1
      );
    `;
    const { rows } = await this.pool.query(query, [studentId]);
    return rows;
  }

  // Get courses taught by a specific teacher
  async getTeacherCourses(teacherId: string) {
    // Log the ID to verify it matches the database UUID exactly
    console.log("Searching for Teacher UUID:", teacherId);

    const query = `
    SELECT 
      c.id, 
      c.name, 
      c.code, 
      c.description,
      COUNT(e.id) AS student_count
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    WHERE c.teacher_id = $1 
      AND (c.deleted_at IS NULL OR c.deleted_at::text = '')
    GROUP BY c.id;
  `;

    try {
      const { rows } = await this.pool.query(query, [teacherId]);
      console.log("Database Response Rows:", rows);
      return rows;
    } catch (error) {
      console.error("Query Error:", error);
      throw error;
    }
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

  // For Students: Get enrolled courses
  async getEnrolledCourses(studentId: string) {
    const query = `
    SELECT 
      c.id, c.name, c.code, c.description,
      CONCAT(p.first_name, ' ', p.last_name) AS teacher_name,
      e.enrolled_at,
      e.status AS enrollment_status,
      0 AS progress -- You can replace this with actual progress logic later
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN profiles p ON c.teacher_id = p.user_id
    WHERE e.student_id = $1 AND c.deleted_at IS NULL
  `;
    const { rows } = await this.pool.query(query, [studentId]);
    return rows;
  }

  // Fetch all instructors with their courses
  async getAllInstructorsWithCourses() {
    const query = `
    SELECT 
      u.id AS user_id,
      u.email,
      p.first_name,
      p.last_name,
      CONCAT(p.first_name, ' ', p.last_name) AS full_name, 
      (
        SELECT JSON_AGG(json_build_object(
          'id', c.id,
          'name', c.name,
          'code', c.code
        ))
        FROM courses c
        WHERE c.teacher_id = u.id AND c.deleted_at IS NULL
      ) AS courses,
      (
        SELECT COUNT(*) 
        FROM courses c 
        WHERE c.teacher_id = u.id AND c.deleted_at IS NULL
      ) AS course_count
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE u.role = 'Teacher'
    ORDER BY p.last_name ASC;
  `;

    const { rows } = await this.pool.query(query);
    return rows;
  }

  // 1. Get courses with their nested enrolled students
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

  // Assign a student to a course

  // enrollment.repository.ts
  async addEnrollment(studentId: string, courseId: number) {
    const query = `
    INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
    VALUES ($1::uuid, $2, 'Active', CURRENT_TIMESTAMP) 
    ON CONFLICT (student_id, course_id) DO NOTHING
    RETURNING *;
  `;
    // The ::uuid tells PostgreSQL to convert the string to a UUID type
    const { rows } = await this.pool.query(query, [studentId, courseId]);
    return rows[0];
  }

  // Remove a student from a course
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

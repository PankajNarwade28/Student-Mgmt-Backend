import { Pool } from "pg";
import bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class AdminRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // ==========================================
  // 1. User Management (Core Auth/Users)
  // ==========================================

  async findByEmail(email: string) {
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await this.pool.query(query, [email]);
    return rows[0];
  }

  async createUser(email: string, role: string): Promise<any> {
    const defaultPassword =
      role.toLowerCase() === "teacher" ? "Teacher@2026" : "Student@2026";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const query = `
      INSERT INTO users (email, password, role, is_active) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, email, role, is_active, created_at
    `;

    try {
      const { rows } = await this.pool.query(query, [
        email,
        hashedPassword,
        role,
        false,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Database error during user creation:", error);
      throw error;
    }
  }

  async getAllUsers() {
    const query =
      "SELECT id, email, role, is_active, created_at, updated_at FROM users";
    const { rows } = await this.pool.query(query);
    return rows;
  }

  async updateUser(id: string, email: string, role: string): Promise<any> {
    const query = `
      UPDATE users 
      SET email = $1, role = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING id, email, role, is_active, updated_at
    `;
    try {
      const { rows } = await this.pool.query(query, [
        email.toLowerCase().trim(),
        role,
        id,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Error updating user in repository:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    const query = "DELETE FROM users WHERE id = $1";
    await this.pool.query(query, [id]);
  }

  // ==========================================
  // 2. Student & Profile Management
  // ==========================================

  async getStudentsWithProfiles() {
    const query = `
      SELECT 
        u.id, u.email, u.is_active, u.created_at,
        p.first_name, p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'Student'
      ORDER BY u.created_at DESC;
    `;
    const { rows } = await this.pool.query(query);
    return rows;
  }

  async getStudentStats() {
    const query = `
      SELECT 
        COUNT(*) AS total_students,
        COUNT(*) FILTER (WHERE is_active = true) AS active_students,
        (SELECT COUNT(*) FROM enrollments) AS total_enrollments
      FROM users 
      WHERE role = 'Student';
    `;
    const { rows } = await this.pool.query(query);
    return rows[0];
  }

  // ==========================================
  // 3. Enrollment Management
  // ==========================================

  /**
   * Fetches students for a specific course to be used in the EnrollmentStatus.tsx table
   */
  // async getStudentsByCourse(courseId: number) {
  //   const query = `
  //     SELECT
  //       e.id as enrollment_id,
  //       u.id as student_id,
  //       CONCAT(p.first_name, ' ', p.last_name) as student_name,
  //       e.status
  //     FROM enrollments e
  //     JOIN users u ON e.student_id = u.id
  //     LEFT JOIN profiles p ON u.id = p.user_id
  //     WHERE e.course_id = $1;
  //   `;
  //   const { rows } = await this.pool.query(query, [courseId]);
  //   return rows;
  // }

  async updateEnrollmentStatus(
    enrollmentId: number,
    status: string,
    adminId: string,
  ) {
    const query = `
      UPDATE enrollments 
      SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [
      enrollmentId,
      status,
      adminId,
    ]);
    return rows[0];
  }

  /**
   * Fetches all students enrolled in a specific course.
   * Used for the Enrollment Management table view.
   */
  async getStudentsByCourse(courseId: number) {
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
      AND e.deleted_at IS NULL
    ORDER BY student_name ASC;
  `;

    try {
      const { rows } = await this.pool.query(query, [courseId]);
      console.log("Fetched students for course:", courseId, rows);
      return rows;
    } catch (error) {
      console.error("Database error in getStudentsByCourse:", error);
      throw error;
    }
  }

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
  // Inside AdminRepository.ts

async getSystemStats() {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE role = 'Student' AND deleted_at IS NULL) as student_count,
      (SELECT COUNT(*) FROM users WHERE role = 'Teacher' AND deleted_at IS NULL) as teacher_count,
      (SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL) as course_count,
      (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0 
            ELSE ROUND((COUNT(CASE WHEN status = 'Active' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1)
          END 
       FROM enrollments WHERE deleted_at IS NULL) as enrollment_rate
  `;
  const { rows } = await this.pool.query(query);
  return rows[0];
}

async getRecentAuditLogs(limit: number = 5) {
  const query = `
    SELECT 
      id, 
      operation as type, 
      changed_by as user,
      table_name as table_name,
      changed_at as date
    FROM audit_logs
    ORDER BY changed_at DESC
    LIMIT $1
  `;
  const { rows } = await this.pool.query(query, [limit]);
  return rows;
}
}

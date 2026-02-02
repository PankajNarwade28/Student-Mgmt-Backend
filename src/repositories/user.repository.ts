// src/repositories/user.repository.ts
import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";

@injectable() //Decorator: This marks the AuthController so that the Inversify container can manage its lifecycle and dependencies
export class UserRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}
  // Find a user by email (active users only)
  async findByEmail(email: string) {
    const query = "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [email]);
    return result.rows[0];
  }
  // Create a new user
  async createUser(email: string, passwordHash: string, role: string) {
    const query = `
      INSERT INTO users (email, password, role) 
      VALUES ($1, $2, $3) 
      RETURNING id, email, role, created_at
    `;
    const result = await this.pool.query(query, [email, passwordHash, role]);
    return result.rows[0];
  }

  // Get User page wise according to roles
  async getDetailedUserDirectory(limit: number, offset: number, role?: string) {
    try {
      // Dynamic WHERE clause
      const roleFilter = role && role !== "All" ? `AND u.role = $3` : "";

      const query = `
      SELECT 
        u.id, u.email, u.role, u.is_active, u.created_at,
        p.first_name, p.last_name, p.phone_number,
        (SELECT COALESCE(JSON_AGG(c.name), '[]'::json)
         FROM courses c
         WHERE (c.teacher_id = u.id OR c.id IN (
           SELECT course_id FROM enrollments WHERE student_id = u.id
         )) AND c.deleted_at IS NULL
        ) as related_courses,
        COUNT(*) OVER() AS total_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.deleted_at IS NULL ${roleFilter} 
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

      const params =
        role && role !== "All" ? [limit, offset, role] : [limit, offset];
      const { rows } = await this.pool.query(query, params);

      const totalCount =
        rows.length > 0 ? Number.parseInt(rows[0].total_count) : 0;

      return { users: rows, totalCount };
    } catch (err) {
      console.error(err)
      throw err;
    }
  }

  // Password status by ID
  async findPasswordAndStatusById(userId: string) {
    const query =
      "SELECT password, is_active FROM users WHERE id = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  // Update Password
  async updatePassword(userId: string, newPasswordHash: string) {
    const query = `
      UPDATE users 
      SET password = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await this.pool.query(query, [userId, newPasswordHash]);
  }

  // Update Status from Inactive to Active for first update password
  async updateStatus(userId: string, isActive: boolean) {
    const query = "UPDATE users SET is_active = $2 WHERE id = $1";
    await this.pool.query(query, [userId, isActive]);
  }
}

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

  // user.repository.js
  async getDetailedUserDirectory() {
    try {
      const query = `
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.is_active, 
        u.created_at,
        p.first_name, 
        p.last_name, 
        p.phone_number,
        -- Use a simpler subquery for courses to avoid Group By issues
        (SELECT COALESCE(JSON_AGG(c.name), '[]'::json)
         FROM courses c
         WHERE (c.teacher_id = u.id OR c.id IN (
            SELECT course_id FROM enrollments WHERE student_id = u.id
         )) AND c.deleted_at IS NULL
        ) as related_courses
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      -- Remove this line if your 'users' table doesn't use soft deletes
      WHERE u.deleted_at IS NULL 
      ORDER BY u.created_at DESC;
    `;
      const { rows } = await this.pool.query(query);
      console.log("Detailed User Directory fetched successfully.", rows.length);
      return rows;
    } catch (err) {
      if (err instanceof Error)
      console.error("DATABASE_ERROR:", err.message); // This will show in your terminal
      throw err; // Send it to controller
    }
  }

  async findPasswordAndStatusById(userId: string) {
    const query = "SELECT password, is_active FROM users WHERE id = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    const query = `
      UPDATE users 
      SET password = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await this.pool.query(query, [userId, newPasswordHash]);
  }

  async updateStatus(userId: string, isActive: boolean) {
    const query = "UPDATE users SET is_active = $2 WHERE id = $1";
    await this.pool.query(query, [userId, isActive]);
  }
}

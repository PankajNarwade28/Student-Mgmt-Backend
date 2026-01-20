// src/repositories/user.repository.ts
import { pool } from '../config/db';

export class UserRepository {
  // Find a user by email (active users only)
  async findByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Create a new user
  async createUser(email: string, passwordHash: string, role: string) {
    const query = `
      INSERT INTO users (email, password, role) 
      VALUES ($1, $2, $3) 
      RETURNING id, email, role, created_at
    `;
    const result = await pool.query(query, [email, passwordHash, role]);
    return result.rows[0];
  }
}
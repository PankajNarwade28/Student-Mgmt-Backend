// src/repositories/user.repository.ts
import { inject, injectable } from 'inversify'; 
import { Pool } from 'pg';
import { TYPES } from '../config/types';


@injectable()  //Decorator: This marks the AuthController so that the Inversify container can manage its lifecycle and dependencies
export class UserRepository {
 constructor(@inject(TYPES.DbPool) private pool: Pool) {}
  // Find a user by email (active users only)
  async findByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL'; 
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
}
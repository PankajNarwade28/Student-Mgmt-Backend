import { Pool } from "pg";
import bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class AdminRepository {

  // Inject the database pool directly
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  async findByEmail(email: string) {
    console.log("Searching for email:", email); // DEBUG HERE
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await this.pool.query(query, [email]);
    return rows[0];
  }

  async createUser(email: string, role: string): Promise<any> {
    console.log("Creating user with email:", email, "and role:", role); // DEBUG HERE
    // 1. Determine default password based on role
    // Normalize role to lowercase to avoid "Teacher" vs "teacher" mismatches
    const defaultPassword =
      role.toLowerCase() === "teacher" ? "Teacher@2026" : "Student@2026";

    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const queryText = `
      INSERT INTO users (email, password, role, is_active) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, email, role, is_active, created_at
    `;

    try {
      // ONLY HASH ONCE HERE

      const { rows } = await this.pool.query(queryText, [
        email,
        hashedPassword,
        role,
        false, // is_active set to false
      ]);
      return rows[0];
    } catch (error: any) {
      console.error("Database error during user creation:", error);
      throw error;
    }
  }

  async getAllUsers() {
    // Make sure there is no WHERE clause hiding inactive users
    const query =
      "SELECT id, email, role, is_active ,created_at, updated_at FROM users";
    const { rows } = await this.pool.query(query);
    return rows;
  }

  async updateUser(id: string, email: string, role: string): Promise<any> {
    const query = `
    UPDATE users 
    SET 
      email = $1, 
      role = $2, 
      updated_at = NOW() -- This ensures the timestamp changes
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
}

// repositories/UserRepository.ts
import { Pool } from "pg";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class EmailRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // repositories/EmailRepository.ts
  async findByEmail(email: string) {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    return result.rows[0];
  }

  // repositories/EmailRepository.ts

  async updateResetToken(userId: string, token: string, expiry: Date) {
    // Log for debugging
    console.log(
      `Updating user ${userId} with token ${token.substring(0, 5)}...`,
    );

    const query = `
        UPDATE users 
        SET reset_password_token = $1, reset_password_expires = $2 
        WHERE id = $3
    `;

    const result = await this.pool.query(query, [token, expiry, userId]);

    // Check if any row was actually changed
    if (result.rowCount === 0) {
      console.error("❌ No user found with ID:", userId);
    } else {
      console.log("✅ Database 1 updated successfully.");
    }
  }

  async findByResetToken(token: string) {
    const query = `
    SELECT * FROM users 
    WHERE reset_password_token = $1 
    AND reset_password_expires > NOW()
  `;
    const result = await this.pool.query(query, [token]);
    return result.rows[0];
  }

  async updatePassword(userId: string, hashedPass: string) {
    const query = `
    UPDATE users 
    SET password = $1, 
        reset_password_token = NULL, 
        reset_password_expires = NULL 
    WHERE id = $2
  `;
    await this.pool.query(query, [hashedPass, userId]);
  }
  // Update Status from Inactive to Active for first update password

  async updateStatus(userId: string, isActive: boolean) {
    const query = "UPDATE users SET is_active = $2 WHERE id = $1";

    await this.pool.query(query, [userId, isActive]);
  }
}

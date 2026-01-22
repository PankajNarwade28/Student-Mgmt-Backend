// src/repositories/profile.repository.ts
import { Pool } from "pg";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class ProfileRepository {
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  async getProfileByUserId(userId: string) {
    const query = "SELECT * FROM profiles WHERE user_id = $1";
    const { rows } = await this.pool.query(query, [userId]);
    return rows[0];
  }

  async upsertProfile(data: any) {
    const query = `
      INSERT INTO profiles (user_id, first_name, last_name, date_of_birth, phone_number)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        date_of_birth = EXCLUDED.date_of_birth,
        phone_number = EXCLUDED.phone_number
      RETURNING *;
    `;

    const values = [
      data.user_id,
      data.first_name,
      data.last_name,
      data.date_of_birth,
      data.phone_number,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }
}
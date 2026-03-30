// // src/repositories/audit.repository.ts
import { Pool } from "pg";
import { TYPES } from "../config/types";
import { inject, injectable } from "@inversifyjs/core";
 
 
@injectable()
export class AuditRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  async getLogsPaged(page: number, limit: number) {
    const offset = (page - 1) * limit;
    
    // Query both the data and the total count in one go or two separate queries
    const query = `
      SELECT *, count(*) OVER() AS total_count
      FROM audit_logs 
      ORDER BY changed_at DESC 
      LIMIT $1 OFFSET $2;
    `;
    
    const { rows } = await this.pool.query(query, [limit, offset]);
    
    return {
      data: rows,
      total: rows.length > 0 ? Number.parseInt(rows[0].total_count) : 0
    };
  }
}
// src/repositories/audit.repository.ts
import { Pool } from "pg";
import { TYPES } from "../config/types";
import { inject, injectable } from "@inversifyjs/core";

@injectable()
export class AuditRepository {
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  async getAllLogs() {
    const query = `
      SELECT 
        id, 
        table_name, 
        operation, 
        changed_by, 
        changed_at, 
        old_data, 
        new_data 
      FROM audit_logs 
      ORDER BY changed_at DESC 
      LIMIT 100;
    `;
    const { rows } = await this.pool.query(query);
    return rows;
  }
}
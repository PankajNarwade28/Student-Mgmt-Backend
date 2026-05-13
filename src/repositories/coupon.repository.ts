import { Pool } from "pg";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class CouponRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // Get All Coupons
  async getAll() {
    const res = await this.pool.query(
      "SELECT * FROM coupons ORDER BY created_at DESC",
    );
    return res.rows;
  }
  //  Create New Coupons
  async create(data: any) {
    const query = `
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [
      data.code.toUpperCase(),
      data.discount_type,
      data.discount_value,
      data.min_order_amount,
      data.max_discount,
      data.expiry_date,
    ];
    const res = await this.pool.query(query, values);
    return res.rows[0];
  }

  // Delete Coupons
  async delete(id: number) {
    await this.pool.query("DELETE FROM coupons WHERE id = $1", [id]);
  }

  // Toggle Status of Coupons
  async toggleStatus(id: number, status: boolean) {
    await this.pool.query("UPDATE coupons SET is_active = $2 WHERE id = $1", [
      id,
      status,
    ]);
  }
}

import { Pool } from 'pg';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';

@injectable()
export class FeeRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  async getStudentEnrollmentFees(studentId: string) {
    const query = `
      SELECT 
        e.id AS enrollment_id,
        c.name AS course_name,
        cf.base_amount AS total_fee,
        CASE 
          WHEN sp.status = 'Paid' THEN 'Paid' 
          ELSE 'Pending' 
        END AS payment_status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN course_fees cf ON c.id = cf.course_id
      LEFT JOIN student_payments sp ON e.id = sp.enrollment_id
      WHERE e.student_id = $1 AND e.deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [studentId]);
    return result.rows;
  }

  async recordPayment(enrollmentId: number, amount: number) {
    const query = `
      INSERT INTO student_payments (enrollment_id, amount_paid)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await this.pool.query(query, [enrollmentId, amount]);
    return result.rows[0];
  }
}
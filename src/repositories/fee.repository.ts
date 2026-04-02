import { Pool } from 'pg';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';

@injectable()
export class FeeRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // async getStudentEnrollmentFees(studentId: string) {
  //   const query = `
  //     SELECT 
  //       e.id AS enrollment_id,
  //       c.name AS course_name,
  //       cf.base_amount AS total_fee,
  //       CASE 
  //         WHEN sp.status = 'Paid' THEN 'Paid' 
  //         ELSE 'Pending' 
  //       END AS payment_status
  //     FROM enrollments e
  //     JOIN courses c ON e.course_id = c.id
  //     JOIN course_fees cf ON c.id = cf.course_id
  //     LEFT JOIN student_payments sp ON e.id = sp.enrollment_id
  //     WHERE e.student_id = $1 AND e.deleted_at IS NULL
  //   `;
  //   const result = await this.pool.query(query, [studentId]);
  //   return result.rows;
  // }

  // FeeRepository.ts

async getAllTransactions() {
  const query = `
    SELECT 
      sp.razorpay_payment_id AS id,
      u.email AS student_email, -- Or u.name if you have a name column
      c.name AS course_name,
      sp.payment_date::date AS date,
      sp.amount_paid AS amount,
      sp.status
    FROM student_payments sp
    JOIN enrollments e ON sp.enrollment_id = e.id
    JOIN users u ON e.student_id = u.id
    JOIN courses c ON e.course_id = c.id
    ORDER BY sp.payment_date DESC;
  `;
  const result = await this.pool.query(query);
  return result.rows;
}

 async recordPayment(
  enrollmentId: number, 
  amount: number, 
  orderId: string, 
  paymentId: string, 
  signature: string
) {
  const query = `
    INSERT INTO student_payments 
      (enrollment_id, amount_paid, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
    VALUES 
      ($1, $2, $3, $4, $5, 'Paid')
    ON CONFLICT (enrollment_id) 
    DO UPDATE SET 
      razorpay_order_id = EXCLUDED.razorpay_order_id, 
      razorpay_payment_id = EXCLUDED.razorpay_payment_id, 
      razorpay_signature = EXCLUDED.razorpay_signature, 
      status = 'Paid',
      payment_date = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [enrollmentId, amount, orderId, paymentId, signature];
  const result = await this.pool.query(query, values);
  return result.rows[0];
}

 // 1. Record the Initial Order Intent (Status: 'Created')
  async createPaymentIntent(enrollmentId: number, amount: number, orderId: string) {
    const query = `
      INSERT INTO student_payments (enrollment_id, amount_paid, razorpay_order_id, status)
      VALUES ($1, $2, $3, 'Created')
      ON CONFLICT (enrollment_id) 
      DO UPDATE SET razorpay_order_id = $3, status = 'Created'
      RETURNING *;
    `;
    const result = await this.pool.query(query, [enrollmentId, amount, orderId]);
    return result.rows[0];
  }

  // 2. Finalize the Payment (Status: 'Paid')
  async confirmPayment(orderId: string, paymentId: string, signature: string) {
    const query = `
      UPDATE student_payments
      SET 
        razorpay_payment_id = $2,
        razorpay_signature = $3,
        status = 'Paid',
        payment_date = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $1
      RETURNING *;
    `;
    const result = await this.pool.query(query, [orderId, paymentId, signature]);
    return result.rows[0];
  }

  // 3. Get Fees with Join (As discussed before)
  async getStudentEnrollmentFees(studentId: string) {
    const query = `
      SELECT 
        e.id AS enrollment_id,
        c.name AS course_name,
        cf.base_amount AS total_fee,
        COALESCE(sp.status, 'Pending') AS payment_status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN course_fees cf ON c.id = cf.course_id
      LEFT JOIN student_payments sp ON e.id = sp.enrollment_id
      WHERE e.student_id = $1 AND e.deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [studentId]);
    return result.rows;
  }
}
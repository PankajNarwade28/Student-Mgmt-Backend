import { injectable, inject } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../config/types";

@injectable()
export class AttendanceRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // TEACHER: Create a session and bulk mark records
  async markAttendance(teacherId: string, scheduleId: number, topic: string, records: Record<string, string>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Create the session
      const sessionRes = await client.query(
        `INSERT INTO attendance_sessions (schedule_id, teacher_id, topic_covered, session_date) 
         VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id`,
        [scheduleId, teacherId, topic]
      );
      const sessionId = sessionRes.rows[0].id;

      // 2. Prepare bulk insert for records
      const studentIds = Object.keys(records);
      for (const studentId of studentIds) {
        await client.query(
          `INSERT INTO attendance_records (session_id, student_id, status) VALUES ($1, $2, $3)`,
          [sessionId, studentId, records[studentId]]
        );
      }

      await client.query("COMMIT");
      return { sessionId };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  // ADMIN: Global logs with joins
 // Inside attendance.repository.ts
async getGlobalReport() {
  const query = `
    SELECT 
      r.id, 
      u.email as student_name, -- Changed from u.name to u.email
      u.id as student_uid,
      s.topic_covered as class_name,
      t.email as teacher_name, -- Changed from t.name to t.email
      r.status,
      r.marked_at
    FROM attendance_records r
    JOIN users u ON r.student_id = u.id
    JOIN attendance_sessions s ON r.session_id = s.id
    JOIN users t ON s.teacher_id = t.id
    ORDER BY r.marked_at DESC LIMIT 100
  `;
  const res = await this.pool.query(query);
  return res.rows;
}
  // STUDENT: Personal history
  async getStudentRecords(studentId: string) {
    const query = `
      SELECT s.session_date as date, s.topic_covered, r.status
      FROM attendance_records r
      JOIN attendance_sessions s ON r.session_id = s.id
      WHERE r.student_id = $1
      ORDER BY s.session_date DESC
    `;
    const res = await this.pool.query(query, [studentId]);
    return res.rows;
  }
}
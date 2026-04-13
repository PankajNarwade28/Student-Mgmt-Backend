// src/repositories/schedule.repository.ts
import { Pool } from "pg";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class ScheduleRepository {
  constructor(@inject(TYPES.DbPool) private readonly pool: Pool) {}

  // Fetch weekly template for a teacher
  async getWeeklySchedules(teacherId: string) {
    const query = `
      SELECT cs.*, c.name as course_name 
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE c.teacher_id = $1
      ORDER BY 
        CASE day_of_week 
          WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
        END, start_time ASC;
    `;
    const { rows } = await this.pool.query(query, [teacherId]);
    return rows;
  }

  // Fetch daily slots with current session status
  async getDailySchedules(teacherId: string, date: string, dayName: string) {
    const query = `
      SELECT cs.*, c.name as course_name, asess.id as session_id, asess.topic_covered
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN attendance_sessions asess ON asess.schedule_id = cs.id AND asess.session_date = $2
      WHERE c.teacher_id = $1 AND cs.day_of_week = $3
      ORDER BY cs.start_time ASC;
    `;
    const { rows } = await this.pool.query(query, [teacherId, date, dayName]);
    return rows;
  }

  async deleteSchedule(id: number, teacherId: string) {
    const query = `
      DELETE FROM course_schedules 
      WHERE id = $1 AND course_id IN (SELECT id FROM courses WHERE teacher_id = $2)
    `;
    return await this.pool.query(query, [id, teacherId]);
  }

  // src/repositories/schedule.repository.ts
// src/repositories/schedule.repository.ts
// async getSchedulesByWeek(teacherId: string, startDate: string, endDate: string) {
//   const query = `
//     SELECT 
//       cs.*, 
//       c.name as course_name,
//       asess.id as session_id,
//       asess.session_date,
//       asess.is_cancelled
//     FROM course_schedules cs
//     JOIN courses c ON cs.course_id = c.id
//     -- Join with sessions to see if a specific instance exists for this week
//     LEFT JOIN attendance_sessions asess ON 
//       asess.schedule_id = cs.id AND 
//       asess.session_date BETWEEN $2 AND $3
//     WHERE c.teacher_id = $1
//     ORDER BY 
//       CASE cs.day_of_week 
//         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
//         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
//       END, cs.start_time ASC;
//   `;
//   const { rows } = await this.pool.query(query, [teacherId, startDate, endDate]);
//   return rows;
// }

// src/repositories/schedule.repository.ts
async addSchedule(data: { 
  course_id: number, 
  day_of_week: string, 
  start_time: string, 
  end_time: string, 
  room_number: string,
  class_code: string 
}) {
  const query = `
    INSERT INTO course_schedules 
    (course_id, day_of_week, start_time, end_time, room_number, class_code)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    data.course_id, 
    data.day_of_week, 
    data.start_time, 
    data.end_time, 
    data.room_number, 
    data.class_code
  ];
  const { rows } = await this.pool.query(query, values);
  return rows[0];
}

async getSchedulesByWeek(startDate: string, endDate: string, teacherId?: string) {
    let query = `
      SELECT 
        cs.*, 
        c.name as course_name,
        u.email as teacher_email,
        asess.id as session_id,
        asess.session_date
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN attendance_sessions asess ON 
        asess.schedule_id = cs.id AND 
        asess.session_date BETWEEN $1 AND $2
    `;

    const values: any[] = [startDate, endDate];

    // If an Admin wants to filter by a specific teacher, or if a Teacher is logged in
    if (teacherId) {
      query += ` WHERE c.teacher_id = $3`;
      values.push(teacherId);
    }

    query += `
      ORDER BY 
        CASE cs.day_of_week 
          WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
        END, cs.start_time ASC;
    `;

    const { rows } = await this.pool.query(query, values);
    return rows;
  }


  // Fetch all schedules for the week regardless of teacher
  async getAllSchedulesByWeek(startDate: string, endDate: string) {
    const query = `
      SELECT 
        cs.*, 
        c.name as course_name,
        u.email as teacher_email,
        p.first_name || ' ' || p.last_name as teacher_name,
        asess.id as session_id,
        asess.session_date
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN attendance_sessions asess ON 
        asess.schedule_id = cs.id AND 
        asess.session_date BETWEEN $1 AND $2
      ORDER BY 
        CASE cs.day_of_week 
          WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
        END, cs.start_time ASC;
    `;
    const { rows } = await this.pool.query(query, [startDate, endDate]);
    return rows;
  }
 

  // 1. Get All Daily Schedules (Global Admin View)
  async getAllDailySchedules(date: string, dayName: string) {
    const query = `
      SELECT 
        cs.*, 
        c.name as course_name, 
        p.first_name || ' ' || p.last_name as teacher_name,
        asess.id as session_id, 
        asess.topic_covered
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN profiles p ON c.teacher_id = p.user_id
      LEFT JOIN attendance_sessions asess ON 
        asess.schedule_id = cs.id AND asess.session_date = $1
      WHERE cs.day_of_week = $2
      ORDER BY cs.start_time ASC;
    `;
    const { rows } = await this.pool.query(query, [date, dayName]);
    return rows;
  }

  // 2. Global Remove (Admin can delete any entry)
  async deleteScheduleGlobal(id: number) {
    const query = `
      DELETE FROM course_schedules 
      WHERE id = $1;
    `;
    return await this.pool.query(query, [id]);
  
}
// Fetch all schedules for the week (Universal Registry)
 // Update teacherId to be optional with '?'
  async getGlobalWeeklySchedules(startDate: string, endDate: string, teacherId?: string) {
    let query = `
      SELECT 
        cs.*, 
        c.name as course_name,
        p.first_name || ' ' || p.last_name as teacher_name,
        asess.id as session_id,
        asess.session_date
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN profiles p ON c.teacher_id = p.user_id
      LEFT JOIN attendance_sessions asess ON 
        asess.schedule_id = cs.id AND 
        asess.session_date BETWEEN $1 AND $2
    `;

    const values: any[] = [startDate, endDate];

    // Logically append the filter only if a teacherId is provided
    if (teacherId) {
      query += ` WHERE c.teacher_id = $3`;
      values.push(teacherId);
    }

    query += `
      ORDER BY 
        CASE cs.day_of_week 
          WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
        END, cs.start_time ASC;
    `;

    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  // Teacher-only: Initialize a specific attendance session for a slot
  async initializeAttendanceSession(scheduleId: number, date: string, teacherId: string) {
    const query = `
      INSERT INTO attendance_sessions (schedule_id, session_date)
      SELECT $1, $2
      WHERE EXISTS (
        SELECT 1 FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.id = $1 AND c.teacher_id = $3
      )
      RETURNING id;
    `;
    const { rows } = await this.pool.query(query, [scheduleId, date, teacherId]);
    return rows[0];
  }
}
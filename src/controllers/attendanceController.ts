import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { TYPES } from "../config/types";

@injectable()
export class AttendanceController {
  constructor(
    @inject(TYPES.AttendanceRepository) private readonly attendanceRepo: AttendanceRepository
  ) {}

  // POST: /api/teacher/attendance/submit
  submitAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topic, records, scheduleId } = req.body;
      const teacherId = (req as Request & { user: { id: string } }).user.id; // From your Auth middleware

      const result = await this.attendanceRepo.markAttendance(teacherId, scheduleId, topic, records);
      res.status(201).json({ message: "Attendance saved", data: result });
    } catch (err) {
      next(err);
    }
  };

  // GET: /api/admin/attendance/global-report
  getGlobalReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await this.attendanceRepo.getGlobalReport();
      // Calculate summary for Admin StatCards
      const summary = {
        totalActive: new Set(records.map((r: any) => r.session_id)).size,
        dailyAvg: 85, // Dummy logic, calculate as needed
        flagged: records.filter((r: any) => r.status === 'absent').length
      };
      res.json({ records, summary });
    } catch (err) {
      next(err);
    }
  };

  // GET: /api/student/attendance/my-records
  getMyAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = (req as Request & { user: { id: string } }).user.id;
      const records = await this.attendanceRepo.getStudentRecords(studentId);
      
      const presentCount = records.filter((r: any) => r.status === 'present').length;
      const summary = {
        total: records.length,
        present: presentCount,
        percentage: records.length > 0 ? ((presentCount / records.length) * 100).toFixed(1) : 0
      };
      
      res.json({ records, summary });
    } catch (err) {
      next(err);
    }
  };
}
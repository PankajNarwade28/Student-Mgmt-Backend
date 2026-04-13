// src/controllers/scheduleController.ts
import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";
import { ScheduleRepository } from "../repositories/schedule.repository";

@injectable()
export class ScheduleController {
  constructor(
    @inject(TYPES.ScheduleRepository)
    private readonly repository: ScheduleRepository,
  ) {}

  create = async (req: Request, res: Response) => {
    try {
      const newSession = await this.repository.addSchedule(req.body);
      res.status(201).json({ success: true, data: newSession });
    } catch (error) {
    //   res.status(500).json({ message: "Failed to create schedule entry." });
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create schedule entry." });
    }
  };

  // src/controllers/scheduleController.ts
  getWeek = async (req: Request, res: Response) => {
    try {
      const { baseDate } = req.query;
      if (!baseDate)
        return res.status(400).json({ message: "baseDate is required" });

      const current = new Date(baseDate as string);
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(current.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      saturday.setHours(23, 59, 59, 999);

      // Call repository without passing a teacherId
      const data = await this.repository.getAllSchedulesByWeek(
        monday.toISOString().split("T")[0] + "T00:00:00Z",
        saturday.toISOString().split("T")[0] + "T23:59:59Z",
      );

      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ message: "Error fetching global registry" });
    }
  };

  // Handler for GET /api/admin/schedule/day/:date
  getDay = async (req: Request, res: Response) => {
    try {
      const { date } = req.params; // Expects ISO string (e.g., 2026-04-13)
      const dateObj = new Date(date as string);

      // Derive day name for the query
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

      // Fetching all schedules regardless of teacher
      const data = await this.repository.getAllDailySchedules(
        dateObj.toISOString().split("T")[0] + "T00:00:00Z",
        dayName,
      );

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Fetch Error:", error);
      res.status(500).json({ message: "Error fetching global daily registry" });
    }
  };

  // Handler for DELETE /api/admin/schedule/:id
  remove = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Admin bypasses teacher_id ownership check [cite: 150]
      await this.repository.deleteScheduleGlobal(Number(id));

      res.status(200).json({
        success: true,
        message: "Instructional slot permanently removed from registry.",
      });
    } catch (error) {
      console.error("Delete Error:", error);
      res
        .status(500)
        .json({ message: "Failed to remove entry from registry." });
    }
  };

  // src/controllers/scheduleController.ts
// src/controllers/scheduleController.ts
getRegistry = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role; // From authMiddleware [cite: 12]
    const userId = (req as any).user.id;
    const { baseDate } = req.query;

    const current = new Date(baseDate as string);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    // If Teacher, we filter by their ID. If Admin, we pass undefined to see all.
    const effectiveTeacherId = userRole === 'Teacher' ? userId : undefined;

    const data = await this.repository.getGlobalWeeklySchedules(
      monday.toISOString().split('T')[0] + "T00:00:00Z",
      saturday.toISOString().split('T')[0] + "T23:59:59Z",
      effectiveTeacherId // This can now be string or undefined
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Registry Sync Error:", error);
    res.status(500).json({ success: false, message: "Registry sync failed" });
  }
};

  // POST /api/schedule/session/start
  startSession = async (req: Request, res: Response) => {
    try {
      const teacherId = (req as any).user.id; // From authMiddleware [cite: 52]
      const { scheduleId, date } = req.body;
      const session = await this.repository.initializeAttendanceSession(scheduleId, date, teacherId);
      
      if (!session) return res.status(403).json({ message: "Role Mismatch: Not the assigned teacher." });
      res.status(201).json({ success: true, sessionId: session.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate session." });
    }
  };
}

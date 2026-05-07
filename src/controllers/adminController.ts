import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";
import { AdminRepository } from "../repositories/admin.repository";
import { UserRepository } from "../repositories/user.repository";
import { container } from "../config/inversify.config";
import { jsPDF } from "jspdf";
import autoTable, { applyPlugin } from "jspdf-autotable";

// MANDATORY: This attaches the autoTable function to the jsPDF prototype for Node.js
applyPlugin(jsPDF);

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.AdminRepository) private readonly adminRepo: AdminRepository,
  ) {}

  // ==========================================
  // 1. Identity & Access Management (User CRUD)
  // ==========================================

  addUser = async (req: Request, res: Response): Promise<void> => {
    const { email, role } = req.body;
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await this.adminRepo.findByEmail(normalizedEmail);

      if (existingUser) {
        res.status(400).json({ message: "Email already registered" });
        return;
      }

      const newUser = await this.adminRepo.createUser(
        normalizedEmail,
        role || "Student",
      );

      res.status(201).json({
        message: `User created successfully. Default Pass: ${role}@2026`,
        user: newUser,
      });
    } catch (error) {
      console.error("AddUser Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Get query params (default to page 1, limit 10)
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 5;
      const offset = (page - 1) * limit;

      // 2. Call repo with pagination arguments
      const { users, totalCount } = await this.adminRepo.getAllUsers(
        limit,
        offset,
      );

      // 3. Return users + pagination metadata
      res.status(200).json({
        success: true,
        users,
        pagination: {
          totalUsers: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit: limit,
        },
      });
    } catch (error) {
      console.error("GetUsers Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role, email } = req.body;
    try {
      const updatedUser = await this.adminRepo.updateUser(
        id as string,
        email.toLowerCase().trim(),
        role,
      );
      res.status(200).json({ message: "User updated", user: updatedUser });
    } catch (error) {
      console.error("UpdateUser Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  removeUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      await this.adminRepo.deleteUser(id as string);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("RemoveUser Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // ==========================================
  // 2. Directory & Reporting Services
  // ==========================================

  getUserDirectory = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 9;
      const role = req.query.role as string; // Extract role from query
      const offset = (page - 1) * limit;

      const userRepository = container.get<UserRepository>(
        TYPES.UserRepository,
      );
      const { users, totalCount } =
        await userRepository.getDetailedUserDirectory(limit, offset, role);

      res.status(200).json({
        success: true,
        users,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
        },
      });
    } catch (error: unknown) {
      console.error("Error:", error);
      res.status(500).json({ success: false, message: "Database error" });
    }
  };

  // ==========================================
  // 3. Enrollment Lifecycle Management
  // ==========================================

  getAllStudents = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 1;
      const offset = (page - 1) * limit;

      const { students, totalCount } =
        await this.adminRepo.getStudentsWithProfiles(limit, offset);

      res.status(200).json({
        success: true,
        students,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
        },
      });
    } catch (error) {
      console.error("Get All Students Error:", error);
      res.status(500).json({ message: "Error fetching students" });
    }
  };

  /**
   * GET /api/admin/courses/:courseId/enrollments
   * Returns student list for the EnrollmentStatus table
   */

  getCourseEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const enrollments = await this.adminRepo.getStudentsByCourse(
        Number(courseId),
      );
      res.status(200).json(enrollments);
    } catch (error) {
      console.error("Fetch Enrollments Error:", error);
      res.status(500).json({ message: "Failed to fetch course enrollments" });
    }
  };

  // Inside AdminController.ts

  getAnalytics = async (req: Request, res: Response) => {
    try {
      const stats = await this.adminRepo.getSystemStats();
      const logs = await this.adminRepo.getRecentAuditLogs(5);

      res.status(200).json({
        stats: {
          totalStudents: stats.student_count,
          activeTeachers: stats.teacher_count,
          totalCourses: stats.course_count,
          enrollmentRate: stats.enrollment_rate,
        },
        recentActivity: logs,
      });
    } catch (error) {
      console.error("Analytics Error:", error);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  };

  // Inside AdminController.ts

  exportSystemReport = async (req: Request, res: Response) => {
    try {
      const stats = await this.adminRepo.getSystemStats();
      const logs = await this.adminRepo.getRecentAuditLogs(25);

      const doc = new jsPDF();
      const purple: [number, number, number] = [99, 102, 241];

      // 1. Header
      doc.setFontSize(20);
      doc.setTextColor(purple[0], purple[1], purple[2]);
      doc.text("System Analytics Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(
        `Total Students: ${stats.student_count} | Teachers: ${stats.teacher_count}`,
        14,
        36,
      );

      // 2. Table - Now correctly attached via applyPlugin
      autoTable(doc, {
        startY: 45,
        head: [["User", "Operation", "Table", "Date"]],
        body: logs.map((log: any) => [
          log.user,
          log.type,
          log.table_name,
          new Date(log.date).toLocaleDateString(),
        ]),
        headStyles: { fillColor: purple },
        styles: { fontSize: 9 },
      });

      // 3. Output as Buffer
      // Use "arraybuffer" for modern Node versions or "datauristring" for older ones
      const pdfOutput = doc.output("arraybuffer");
      const buffer = Buffer.from(pdfOutput);

      // 4. Send with correct headers
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="System_Report.pdf"',
        "Content-Length": buffer.length,
      });

      return res.end(buffer);
    } catch (error: any) {
      console.error("PDF Export Error:", error);
      // If we haven't sent headers yet, send a clean JSON error
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Failed to generate PDF", details: error.message });
      }
    }
  };
}

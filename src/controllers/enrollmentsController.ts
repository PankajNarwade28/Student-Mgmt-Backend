import { Request, Response } from "express";
import { EnrollmentRepository } from "../repositories/enrollments.repository";
import { inject } from "inversify";
import { TYPES } from "../config/types";

export class EnrollmentController {
  constructor(
    @inject(TYPES.EnrollmentRepository)
    private readonly repository: EnrollmentRepository,
  ) {}

  // Gets the combined data for the Enrollments UI
  fetchEnrollmentData = async (req: Request, res: Response) => {
    try {
      const [courses, students] = await Promise.all([
        this.repository.getEnrollmentDetails(),
        this.repository.getActiveStudentsList(),
      ]);
      res.status(200).json({ courses, students });
    } catch (error) {
      console.error("Error fetching enrollment data:", error);
      res.status(500).json({ message: "Error fetching enrollment data" });
    }
  };

  // Handles student assignment
  enrollStudent = async (req: Request, res: Response) => {
    try {
      // 1. Check these names carefully!
      const { studentId, courseId } = req.body;

      console.log("Adding enrollment for:", { studentId, courseId });

      if (!studentId || !courseId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await this.repository.addEnrollment(studentId, courseId);
      res.status(201).json(result);
    } catch (error: any) {
      // 2. This is what sends the 500 error you see
      console.error("DATABASE ERROR:", error.message);
      res.status(500).json({ message: error.message });
    }
  };
  // Handles student removal
  removeEnrollment = async (req: Request, res: Response) => {
    try {
      const { studentId, courseId } = req.body;
      const result = await this.repository.removeEnrollment(
        studentId,
        courseId,
      );
      if (!result) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.status(200).json({ message: "Student removed successfully" });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({ message: "Error removing student" });
    }
  };

  // EnrollmentController.ts

  add = async (req: Request, res: Response) => {
    try {
      const { studentId, courseId } = req.body;
      if (!studentId || !courseId) {
        return res
          .status(400)
          .json({ message: "Student ID and Course ID are required" });
      }

      const result = await this.repository.addEnrollment(studentId, courseId);
      res
        .status(201)
        .json({ message: "Student assigned successfully", data: result });
    } catch (error) {
      console.error("Error adding enrollment:", error);
      res.status(500).json({ message: "Error assigning student" });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const { studentId, courseId } = req.body;
      const result = await this.repository.removeEnrollment(
        studentId,
        courseId,
      );

      if (!result) {
        return res.status(404).json({ message: "Enrollment record not found" });
      }

      res.status(200).json({ message: "Student removed successfully" });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({ message: "Error removing student" });
    }
  };

  /**
   * GET /api/admin/courses/:courseId/enrollments
   */
  getCourseEnrollments = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      // 1. Validation: Ensure courseId is a valid number
      const numericCourseId = Number(courseId);
      if (Number.isNaN(numericCourseId)) {
        return res.status(400).json({ message: "Invalid Course ID format" });
      }
      // 2. Fetch enrollments from the repository
      const enrollments =
        await this.repository.getEnrollmentsByCourse(numericCourseId);
      console.log("Fetched Enrollments:", enrollments);

      // 3. Response
      return res.status(200).json(enrollments);
    } catch (error: unknown) {
      console.error("Controller Error (getCourseEnrollments):", error);
      return res
        .status(500)
        .json({ message: "Internal server error fetching enrollments" });
    }
  };

  /**
   * PATCH /api/admin/enrollments/:id/status
   * Triggered by the status dropdown in the frontend
   */

  // Inside EnrollmentController.ts
updateEnrollmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = (req as any).user.id;

    console.log("DEBUG: Data received:", { id, status, adminId });

    const updated = await this.repository.updateEnrollmentStatus(Number(id), status, adminId);
    res.status(200).json(updated);
  } catch (error: any) {
    // THIS LINE IS CRITICAL: Look at your terminal output now!
    console.error("BACKEND CRASH LOG:", error.message); 
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};
}

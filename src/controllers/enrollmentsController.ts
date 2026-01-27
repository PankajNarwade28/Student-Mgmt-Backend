import { Request, Response } from "express";
import { EnrollmentRepository } from "../repositories/enrollments.repository";

export class EnrollmentController {
  constructor(private repository: EnrollmentRepository) {}

  // Gets the combined data for the Enrollments UI
  fetchEnrollmentData = async (req: Request, res: Response) => {
    try {
      const [courses, students] = await Promise.all([
        this.repository.getEnrollmentDetails(),
        this.repository.getActiveStudentsList(),
      ]);
      res.status(200).json({ courses, students });
    } catch (error) {
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
      const result = await this.repository.removeEnrollment(studentId, courseId);
      if (!result) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.status(200).json({ message: "Student removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error removing student" });
    }
  };
}
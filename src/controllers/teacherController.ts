// src/controllers/teacherController.ts
import { Request, Response } from "express";
import { TeacherRepository } from "../repositories/teacher.repository";

export class TeacherController {
  constructor(private repository: TeacherRepository) {}

  fetchCourseStudents = async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId as string, 10);
      const students = await this.repository.getStudentsByCourse(courseId);
      res.status(200).json(students);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching students" });
    }
  };

  submitGrade = async (req: Request, res: Response) => {
    try {
      const { enrollmentId, grade, remarks } = req.body;
      // 'req.user.id' comes from your authMiddleware
      const teacherId = (req as any).user.id; 

      if (!enrollmentId || grade === undefined) {
        return res.status(400).json({ message: "Missing enrollment ID or grade" });
      }

      const result = await this.repository.upsertGrade(
        enrollmentId, 
        parseFloat(grade), 
        remarks || "", 
        teacherId
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error(error.message);
      res.status(500).json({ message: "Failed to save grade data" });
    }
  };
}
// src/controllers/teacherController.ts
import { Request, Response } from "express";
import { TeacherRepository } from "../repositories/teacher.repository";

export class TeacherController {
  constructor(private readonly repository: TeacherRepository) {}

  fetchCourseStudents = async (req: Request, res: Response) => {
    try {
      const courseId = Number.parseInt(req.params.courseId as string, 10);
      const students = await this.repository.getStudentsByCourse(courseId);
      res.status(200).json(students);
    } catch (error: unknown) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  submitGrade = async (req: Request, res: Response) => {
    try {
      const { enrollmentId, grade, remarks } = req.body;
      // 'req.user.id' comes from your authMiddleware
      const teacherId = (req as any).user.id;

      if (!enrollmentId || grade === undefined) {
        return res
          .status(400)
          .json({ message: "Missing enrollment ID or grade" });
      }

      const result = await this.repository.upsertGrade(
        enrollmentId,
        Number.parseFloat(grade),
        remarks || "",
        teacherId,
      );

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error("Error saving grade data:", error);
      res.status(500).json({ message: "Failed to save grade data" });
    }
  };

  postAnnouncement = async (req: Request, res: Response) => {
    try {
      const { courseId, title, content, type } = req.body;
      const teacherId = (req as any).user.id;

      if (!courseId || !title || !content) {
        return res
          .status(400)
          .json({ message: "Missing required announcement fields" });
      }

      const result = await this.repository.upsertAnnouncement(
        courseId,
        title,
        content,
        type || "notice",
        teacherId,
      );

      res.status(201).json({
        message: "Announcement posted successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in postAnnouncement:", error.message);
      res.status(500).json({ message: "Failed to save announcement" });
    }
  };

  fetchAnnouncements = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const announcements = await this.repository.getAnnouncementsByCourse(
        courseId as string,
      );

      // Return empty array instead of error if no announcements found
      res.status(200).json(announcements || []);
    } catch (error: any) {
      console.error("Controller Error:", error.message);
      res.status(500).json({ message: "Failed to load course updates" });
    }
  };

  removeAnnouncement = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.repository.deleteAnnouncement(
        id as string | number,
      );
      console.log("Delete result:", result);

      if (!result) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      res.status(200).json({ message: "Deleted successfully" });
    } catch (error: unknown) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

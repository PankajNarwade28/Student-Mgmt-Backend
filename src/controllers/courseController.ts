import { Request, Response } from "express";
import { CourseRepository } from "./../repositories/course.repository";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

interface IUpdateCourseRequest {
  name: string;
  code: string;
  description: string;
  teacher_id: string;
}

@injectable()
export class CourseController {
  constructor(
    @inject(TYPES.CourseRepository) private readonly repository: CourseRepository,
  ) {}

  // ==========================================
  // 1. Course Management (CRUD & Admin)
  // ==========================================

  getAllCourses = async (req: Request, res: Response) => {
    try {
      const courses = await this.repository.getAllCourses();
      return res.status(200).json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      return res.status(500).json({ message: "Failed to retrieve courses" });
    }
  };

  addCourse = async (req: Request, res: Response) => {
    try {
      const newCourse = await this.repository.createCourse(req.body);
      return res.status(201).json({
        message: "Course created successfully",
        course: newCourse,
      });
    } catch (error) {
      console.error("Add Course error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  updateCourse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: IUpdateCourseRequest = req.body;
      const updatedCourse = await this.repository.updateCourse(Number(id), updateData);

      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json({
        message: "Course updated successfully",
        course: updatedCourse,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update course" });
    }
  };

  deleteCourse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.repository.deleteCourse(Number(id));
      return res.status(200).json({ message: "Course archived successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete course" });
    }
  };

  restoreCourse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.repository.restoreCourse(Number(id));
      return res.status(200).json({ message: "Course restored successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to restore course" });
    }
  };

  // ==========================================
  // 2. Discovery & Directory Services
  // ==========================================

  getTeachers = async (req: Request, res: Response) => {
    try {
      const teachers = await this.repository.getActiveTeachers();
      return res.status(200).json(teachers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch teachers" });
    }
  };

  fetchInstructors = async (req: Request, res: Response) => {
    try {
      const instructors = await this.repository.getAllInstructorsWithCourses();
      res.status(200).json(instructors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instructor directory" });
    }
  };

  fetchAvailableCourses = async (req: Request, res: Response) => {
    try {
      const courses = await this.repository.getAllAvailableCourses();
      res.status(200).json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  };

  // ==========================================
  // 3. Curriculum & Role-Based Views
  // ==========================================

  getMyCourses = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const role = user?.role;

      if (role === "Student") {
        const enrolled = await this.repository.getEnrolledCourses(userId);
        const available = await this.repository.getAvailableToEnroll(userId);
        return res.json({ enrolled, available });
      }

      if (role === "Teacher") {
        const courses = await this.repository.getTeacherCourses(userId);
        return res.json(courses);
      }

      if (role === "Admin") {
        const courses = await this.repository.getAllCourses();
        return res.json(courses);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching curriculum data" });
    }
  };

  // ==========================================
  // 4. Enrollment & Student Interaction
  // ==========================================

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

  postEnrollmentRequest = async (req: Request, res: Response) => {
    try {
      const { courseId } = req.body;
      const studentId = (req as any).user.id;

      if (!courseId) return res.status(400).json({ message: "Course ID is required" });

      const result = await this.repository.requestEnrollment(studentId, courseId);
      if (!result) {
        return res.status(409).json({ message: "Enrollment request already exists." });
      }

      res.status(201).json({ success: true, message: "Request submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error handling enrollment request" });
    }
  };
}
import { Request, Response } from "express";
import { CourseRepository } from "./../repositories/course.repository";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

// Define the interface here so the class below can find it
interface IUpdateCourseRequest {
  name: string;
  code: string;
  description: string;
  teacher_id: string; // The UUID from your users table
}

// interface AuthRequest extends Request {
//   user: {
//     userId: string;
//     role: string;
//     email?: string;
//   };
// }

@injectable()
export class CourseController {
  constructor(
    // Use TYPES.CourseRepository instead of a raw string
    @inject(TYPES.CourseRepository) private repository: CourseRepository,
  ) {}
  // GET /api/admin/active-teachers
  getTeachers = async (req: Request, res: Response) => {
    try {
      const teachers = await this.repository.getActiveTeachers();
      // console.log("Teachers found in DB:", teachers); // Check your terminal output
      return res.status(200).json(teachers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch teachers" });
    }
  };

  // POST /api/admin/courses
  addCourse = async (req: Request, res: Response) => {
    try {
      // 2. Save to database via Repository
      const newCourse = await this.repository.createCourse(req.body);
      console.log("New Course Created:", newCourse);
      return res.status(201).json({
        message: "Course created successfully",
        course: newCourse,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // GET /api/admin/courses
  getAllCourses = async (req: Request, res: Response) => {
    try {
      const courses = await this.repository.getAllCourses();
      return res.status(200).json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      return res.status(500).json({ message: "Failed to retrieve courses" });
    }
  };

  // DELETE /api/admin/courses/:id
  deleteCourse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Update deleted_at column
      await this.repository.deleteCourse(Number(id));

      return res.status(200).json({
        message: "Course archived/deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete course" });
    }
  };

  // PATCH /api/admin/courses/:id/restore
  restoreCourse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Reset deleted_at to NULL
      await this.repository.restoreCourse(Number(id));

      return res.status(200).json({
        message: "Course restored successfully",
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to restore course" });
    }
  };

  // PUT /api/admin/courses/:id
  updateCourse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: IUpdateCourseRequest = req.body; // Explicit typing

      const updatedCourse = await this.repository.updateCourse(
        Number(id),
        updateData,
      );

      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json({
        message: "Course updated successfully",
        course: updatedCourse,
      });
    } catch (error: unknown) {
      console.error("Update error:", error);
      return res.status(500).json({ message: "Failed to update course" });
    }
  };

  // CourseController.ts
  fetchAvailableCourses = async (req: Request, res: Response) => {
    try {
      const courses = await this.repository.getAllAvailableCourses();
      res.status(200).json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  };

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
        console.log("Fetching courses for Teacher UUID:", userId);
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

  fetchInstructors = async (req: Request, res: Response) => {
    try {
      // Call the repository method we created earlier
      const instructors = await this.repository.getAllInstructorsWithCourses();

      // Return 200 OK with the data
      res.status(200).json(instructors);
    } catch (error: unknown) {
      console.error("Error in fetchInstructors:", error);
      res.status(500).json({
        message: "Failed to fetch instructor directory",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // CourseController.ts
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

  // POST /api/courses/request-enrollment for students to request enrollment
  postEnrollmentRequest = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    const studentId = (req as any).user.id; // Extracted from JWT via authMiddleware

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const result = await this.repository.requestEnrollment(studentId, courseId);

    if (!result) {
      return res.status(409).json({ 
        message: "You have already requested enrollment for this course." 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: "Request submitted successfully" 
    });
  } catch (error: unknown) {
    console.error("Error in postEnrollmentRequest:", error);
    res.status(500).json({ message: "Server error handling enrollment request" });
  }
};

  
  
}

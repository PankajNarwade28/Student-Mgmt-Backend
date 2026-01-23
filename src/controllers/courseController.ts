import { Request, Response } from "express";
import { CourseRepository } from "./../repositories/course.repository";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

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
      console.log("Teachers found in DB:", teachers); // Check your terminal output
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

  /**
   * Soft deletes a course by setting deleted_at to current timestamp.
   */
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

  /**
   * Restores a deleted course by setting deleted_at back to NULL.
   */
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
}

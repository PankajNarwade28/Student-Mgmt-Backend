import { Request, Response, NextFunction } from "express";
import { container } from "../config/inversify.config";
import { CourseRepository } from "../repositories/course.repository";
import { TYPES } from "../config/types";

export const isValidTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teacher_id } = req.body;

    // Resolve the repository using Inversify TYPES
    const repo = container.get<CourseRepository>(TYPES.CourseRepository);

    // Fetch active teachers via the repository method
    const activeTeachers = await repo.getActiveTeachers();

    // Validate the teacher_id against the retrieved list
    const teacherExists = activeTeachers.some((teacher: any) => teacher.id === teacher_id);

    if (!teacherExists) {
      return res.status(400).json({
        status: "error",
        message: "The assigned teacher is invalid, inactive, or not found."
      });
    }

    // Success: terminate middleware and move to controller
    return next();
  } catch (error) {
    console.error("Teacher Validation Middleware Error:", error);
    // Ensure only one response is sent to avoid header errors
    if (!res.headersSent) {
      return res.status(500).json({
        status: "error",
        message: "Internal server error during teacher verification"
      });
    }
  }
};
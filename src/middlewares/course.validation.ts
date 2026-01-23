import { Request, Response, NextFunction } from "express";
import { container } from "../config/inversify.config";
import { CourseRepository } from "../repositories/course.repository";
import { TYPES } from "../config/types";

export const validateCourseData = (req: Request, res: Response, next: NextFunction) => {
  const { name, code, teacher_id } = req.body;
  const errors: Record<string, string> = {};

  // 1. Validate Course Name
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    errors.name = "Course name is required and must be at least 3 characters.";
  }

  // 2. Validate Course Code
  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    errors.code = "A valid course code (min 2 characters) is required.";
  }

  // 3. Validate Teacher ID (UUID Check)
  // Regex to check if teacher_id is a valid UUID format as required by DB
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!teacher_id || !uuidRegex.test(teacher_id)) {
    errors.teacher_id = "A valid Teacher selection is required.";
  }

  // If there are errors, stop the request before it reaches the controller
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ 
      status: 'error', 
      message: "Validation failed", 
      errors 
    });
  }

  // If everything is fine, proceed to the next function
  next();
};

export const checkCourseAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = req.body;

    // 1. If the new role is still 'Teacher', no need to check assignments
    if (role === 'Teacher') {
      return next();
    }

    // 2. Resolve CourseRepository via Inversify
    const courseRepo = container.get<CourseRepository>(TYPES.CourseRepository);
    console.log("Checking course assignments for user:", id);
    // 3. Check if this specific user (as a teacher) has any courses
    const assignments = await courseRepo.getCourseCountByTeacher(id);

    if (assignments > 0) {
      // 4. Block the role change to prevent orphaned courses
      return res.status(400).json({
        status: "error",
        message: `Cannot change role. This user is currently assigned to ${assignments} course(s). Please unassign the courses first.`
      });
    }

    // 5. Proceed if no assignments found
    return next();
  } catch (error) {
    console.error("Assignment Check Middleware Error:", error);
    return res.status(500).json({ status: "error", message: "Internal server error during role validation" });
  }
};
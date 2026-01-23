import { Request, Response, NextFunction } from "express";

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
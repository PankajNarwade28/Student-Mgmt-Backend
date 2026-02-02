// middleware/validateEnrollment.ts
import { Request, Response, NextFunction } from 'express'; 
import { TYPES } from '../config/types';
import { container } from '../config/inversify.config';
export const validateEnrollment = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { studentId, courseId } = req.body;
  const pool = container.get<any>(TYPES.DbPool);

  // Basic Input Validation
  if (!studentId || !courseId) {
    return res.status(400).json({ 
      success: false, 
      message: "Student ID and Course ID are required." 
    });
  }

  try {
    // 1. Check if Student exists and is actually a 'Student'
    const studentCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'Student'", 
      [studentId]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Valid student record not found." 
      });
    }

    // 2. Check if Course exists and is not deleted
    const courseCheck = await pool.query(
      "SELECT id FROM courses WHERE id = $1 AND deleted_at IS NULL", 
      [courseId]
    );
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found or has been removed." 
      });
    }

    // 3. Check for existing active enrollment
    const enrollmentCheck = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
      [studentId, courseId]
    );
    if (enrollmentCheck.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Student is already enrolled in this course." 
      });
    }

    next();
  } catch (error) {
    console.error("Enrollment Validation Error:", error);
    res.status(500).json({ message: "Internal Server Error during validation." });
  }
};
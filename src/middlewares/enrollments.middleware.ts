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
 
export const checkEnrollmentLock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, courseId } = req.body;
    const pool = container.get<any>(TYPES.DbPool);

    if (!studentId || !courseId) {
      return res.status(400).json({ message: "Student ID and Course ID are required" });
    }

    // Query to join enrollments and student_payments
    // We check if status is 'Active' (or your specific 'Locked' term) 
    // AND if there is an entry in student_payments with status 'Paid'
    const query = `
      SELECT e.id, e.status, p.status as payment_status
      FROM enrollments e
      LEFT JOIN student_payments p ON e.id = p.enrollment_id
      WHERE e.student_id = $1 AND e.course_id = $2
    `;
    
    const { rows } = await pool.query(query, [studentId, courseId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No enrollment found for this student and course." });
    }

    const enrollment = rows[0];

    // Logic: Block removal if status is 'Active' AND payment exists as 'Paid'
    // You can adjust these strings based on your exact business rules
    const isPaid = enrollment.payment_status === 'Paid'; 

    if (isPaid && enrollment.status === 'Active') {
      return res.status(400).json({
        status: "error",
        message: `Cannot modify enrollment: Student has an active enrollment with ${courseId}.`
      });
    }

    // If neither paid nor locked, allow the controller to remove the student
    next();
  } catch (error) {
    console.error("Middleware Check Error:", error);
    res.status(500).json({ message: "Internal server error during verification" });
  }
};
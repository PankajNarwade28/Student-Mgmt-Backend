import { Router } from "express";
import { pool } from "../config/db";

// Repositories
import { EnrollmentRepository } from "../repositories/enrollments.repository";
import { AdminRepository } from "../repositories/admin.repository";

// Controllers
import { EnrollmentController } from "../controllers/enrollmentsController";
import { AdminController } from "../controllers/adminController";

// Middlewares
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/access.middleware";
import { checkEnrollmentLock, validateEnrollment } from "../middlewares/enrollments.middleware";

const router = Router();

// ---------------------------------------------------------
// Manual Dependency Injection
// ---------------------------------------------------------
const enrollmentRepo = new EnrollmentRepository(pool);
const enrollmentController = new EnrollmentController(enrollmentRepo);

const adminRepo = new AdminRepository(pool);
const adminController = new AdminController(adminRepo);

// Apply Global Middleware to all routes in this file
router.use(authMiddleware, authorize(["Admin"]));

// ---------------------------------------------------------
// Enrollment Management Routes
// Prefix (assuming mounted at): /api/admin/courses/enrollments
// ---------------------------------------------------------

// GET: Fetch metadata for enrollment forms (dropdowns, etc.)
router.get(
  "/data",
  authMiddleware,
  authorize(["Admin"]),
  enrollmentController.fetchEnrollmentData.bind(enrollmentController),
);

// POST: Add a new student to a course
router.post(
  "/add",
  authMiddleware, // Ensure user is authenticated
  authorize(["Admin"]), // Ensure user has Admin role 
  validateEnrollment,
  enrollmentController.enrollStudent.bind(enrollmentController),
);

// POST: Remove a student from a course
router.post(
  "/remove",
  authMiddleware, // Ensure user is authenticated
  authorize(["Admin"]), // Ensure user has Admin role
  checkEnrollmentLock,
  enrollmentController.removeEnrollment.bind(enrollmentController),
);

// PATCH: Update specific enrollment status (Active, Dropped, Completed)
// NOTE: Ensure this points to the controller that holds the logic.
// If the logic is in AdminController, keep it. If in EnrollmentController, change it.
router.patch(
  "/:enrollmentId/status",
  authMiddleware,
  authorize(["Admin"]), 
  enrollmentController.updateEnrollmentStatus.bind(enrollmentController),
);

// ---------------------------------------------------------
// Redundant / Debug Routes (Cleaned Up)
// ---------------------------------------------------------

// This matches your specific request check but points to the same logic as "/data"
router.get(
  "/course/data",
  enrollmentController.fetchEnrollmentData.bind(enrollmentController),
);

export default router;

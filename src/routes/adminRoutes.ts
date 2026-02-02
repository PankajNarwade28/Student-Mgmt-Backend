import express from "express";
import { container } from "../config/inversify.config";
import { TYPES } from "../config/types";
import { AdminController } from "./../controllers/adminController";
import { authorize } from "../middlewares/access.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateAdminAddUser } from "../middlewares/data.validation";
import { CourseController } from "../controllers/courseController";
import { RequestController } from "../controllers/requestController";
import { EnrollmentController } from "../controllers/enrollmentsController";
import {
  checkCourseAssignments,
  checkEnrollmentCount,
  validateCourseData,
} from "../middlewares/course.validation";
import { isValidTeacher } from "../middlewares/isValidTeacher.middleware";

const router = express.Router();

// ---------------------------------------------------------
// Resolve Controllers from Inversify Container
// ---------------------------------------------------------
const adminController = container.get<AdminController>(TYPES.AdminController);
const courseController = container.get<CourseController>(
  TYPES.CourseController,
);
const requestController = container.get<RequestController>(
  TYPES.RequestController,
);
const enrollmentController = container.get<EnrollmentController>(
  TYPES.EnrollmentController,
);

// ---------------------------------------------------------
// 1. User Management Routes
// ---------------------------------------------------------

router.post(
  "/adduser",
  validateAdminAddUser,
  authMiddleware,
  authorize(["Admin"]),
  adminController.addUser,
);

router.get(
  "/users",
  authMiddleware,
  authorize(["Admin"]),
  adminController.getUsers,
);

router.get(
  "/users/directory",
  authMiddleware,
  authorize(["Admin"]),
  adminController.getUserDirectory,
);

router.put(
  "/users/:id",
  validateAdminAddUser,
  authMiddleware,
  authorize(["Admin"]),
  checkCourseAssignments,
  adminController.updateUser,
);

router.delete(
  "/users/:id",
  authMiddleware,
  authorize(["Admin"]),
  checkCourseAssignments,
  adminController.removeUser,
);

router.get(
  "/students",
  authMiddleware,
  authorize(["Admin"]),
  adminController.getAllStudents.bind(adminController),
);

// ---------------------------------------------------------
// 2. Course & Teacher Management Routes
// ---------------------------------------------------------

router.get(
  "/teachers",
  authMiddleware,
  authorize(["Admin"]),
  courseController.getTeachers.bind(courseController),
);

router.post(
  "/addcourse",
  validateCourseData,
  authMiddleware,
  authorize(["Admin"]),
  isValidTeacher,
  courseController.addCourse.bind(courseController),
);

router.get(
  "/courses",
  authMiddleware,
  authorize(["Admin"]),
  courseController.getAllCourses.bind(courseController),
);

router.put(
  "/courses/:id",
  authMiddleware,
  authorize(["Admin"]),
  isValidTeacher,
  courseController.updateCourse.bind(courseController),
);

router.delete(
  "/courses/:id",
  authMiddleware,
  authorize(["Admin"]),
  checkEnrollmentCount(),
  courseController.deleteCourse.bind(courseController),
);

router.patch(
  "/courses/:id/restore",
  authMiddleware,
  authorize(["Admin"]),
  courseController.restoreCourse.bind(courseController),
);

// ---------------------------------------------------------
// 3. Enrollment & Enrollment Request Routes
// ---------------------------------------------------------

router.get(
  "/courses/enrollment-data",
  authMiddleware,
  authorize(["Admin"]),
  courseController.fetchEnrollmentData.bind(courseController),
);

router.use(
  "/courses/enrollments",
  authMiddleware,
  authorize(["Admin"]),
  require("./enrollmentsRoutes").default,
);

// Fetch all detailed requests (Student Name + Course Name)
router.get(
  "/requests",
  authMiddleware,
  authorize(["Admin"]),
  requestController.getRequests,
);

// Handle the decision (Accept/Enroll or Reject/Delete)
router.post(
  "/requests/:id/decision",
  authMiddleware,
  authorize(["Admin"]),
  requestController.handleDecision,
);

// Fetch all students for a specific course (used by EnrollmentStatus.tsx table)
router.get(
  "/courses/:courseId/enrollments",
  authMiddleware,
  authorize(["Admin"]),
  enrollmentController.getCourseEnrollments.bind(enrollmentController),
);

router.patch(
  "/enrollments/:id/status",
  authMiddleware,
  authorize(["Admin"]),
  enrollmentController.updateEnrollmentStatus.bind(enrollmentController),
);

router.get(
  "/analytics/overview",
  authMiddleware,
  authorize(["Admin"]),
  adminController.getAnalytics.bind(adminController),
);
export default router;

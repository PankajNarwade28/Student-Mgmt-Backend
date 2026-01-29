import express from "express";
import { container } from "../config/inversify.config";
import { TYPES } from "../config/types";
import { AdminController } from "./../controllers/adminController";
import { authorize } from "../middlewares/access.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateAdminAddUser } from "../middlewares/data.validation";
import { CourseController } from "../controllers/courseController";
import {
  checkCourseAssignments,
  validateCourseData,
} from "../middlewares/course.validation";
import { isValidTeacher } from "../middlewares/isValidTeacher.middleware";

import { RequestController } from "../controllers/requestController";

const requestController = container.get<RequestController>(
  TYPES.RequestController,
);

const router = express.Router();

// Resolve the controller from the container
const adminController = container.get<AdminController>(TYPES.AdminController);

// Define the route
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

// admin.routes.ts
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
const courseController = container.get<CourseController>(TYPES.CourseController);
// Ensure this path matches what you put in the api.get() call above
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
router.delete(
  "/courses/:id",
  authMiddleware,
  authorize(["Admin"]),
  courseController.deleteCourse.bind(courseController),
);
router.patch(
  "/courses/:id/restore",
  authMiddleware,
  authorize(["Admin"]),
  courseController.restoreCourse.bind(courseController),
);
router.put(
  "/courses/:id",
  authMiddleware,
  authorize(["Admin"]),
  isValidTeacher,
  courseController.updateCourse.bind(courseController),
);
router.get(
  "/students",
  authMiddleware,
  authorize(["Admin"]),
  adminController.getAllStudents.bind(adminController),
);

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
// router.get("/requests", requestController.getRequests);
// router.patch("/requests/:id", requestController.updateRequestStatus);
// router.delete("/requests/:id", requestController.removeRequest);
// For your admin request management
router.get("/requests", requestController.getRequests);
 
// src/routes/adminRoutes.ts

// 1. Fetch all detailed requests (Student Name + Course Name)
router.get("/requests", requestController.getRequests);

// 2. Handle the decision (Accept/Enroll or Reject/Delete)
// This replaces updateRequestStatus and removeRequest
router.post("/requests/:id/decision", requestController.handleDecision);

// Note: If you no longer have updateRequestStatus or removeRequest 
// in your RequestController class, DELETE those lines to fix the TSError.
export default router;

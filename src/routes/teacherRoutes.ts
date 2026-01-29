// src/routes/teacherRoutes.ts
import { Router } from "express";
import { TeacherController } from "../controllers/teacherController";
import { TeacherRepository } from "../repositories/teacher.repository";
import { pool } from "../config/db";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/access.middleware";

const router = Router();
const repository = new TeacherRepository(pool);
const controller = new TeacherController(repository);

// Prefix: /api/teacher
router.get(
  "/courses/:courseId/students",
  authMiddleware,
  authorize(["Teacher", "Admin"]),
  controller.fetchCourseStudents,
);

router.post(
  "/grades",
  authMiddleware,
  authorize(["Teacher", "Admin"]),
  controller.submitGrade,
);

router.post(
  "/announcements",
  authMiddleware,
  authorize(["Teacher", "Admin"]),
  controller.postAnnouncement,
);
router.get(
  "/courses/:courseId/announcements",
  authMiddleware,
  authorize(["Teacher", "Admin", "Student"]),
  controller.fetchAnnouncements,
);

// router.ts
router.get(
  "/courses/:courseId/announcements",
  authMiddleware,
  controller.fetchAnnouncements,
);
 

router.delete(
  "/announcements/:id",
  authMiddleware,
  authorize(["Teacher", "Admin"]),
  controller.removeAnnouncement,
);

export default router;

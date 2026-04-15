// src/routes/quizRoutes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/access.middleware";
import { QuizController } from "../controllers/quizController";
import { container } from "../config/inversify.config";

const quizCtrl = container.get(QuizController);
const router = Router();

/* ============================
   👨‍🎓 STUDENT ROUTES
============================ */

// View quizzes by course
router.get(
  "/course/:courseId",
  authMiddleware,
  authorize(["Student", "Teacher"]), // teacher can also view
  quizCtrl.getByCourse.bind(quizCtrl)
);

// Submit quiz
router.post(
  "/submit",
  authMiddleware,
  authorize(["Student"]),
  quizCtrl.submit.bind(quizCtrl)
);

/* ============================
   👨‍🏫 TEACHER ROUTES
============================ */

// Get quizzes created by teacher
router.get(
  "/teacher",
  authMiddleware,
  authorize(["Teacher"]),
  quizCtrl.getByTeacher.bind(quizCtrl)
);

// Create full quiz (quiz + questions + options)
router.post(
  "/full-create",
  authMiddleware,
  authorize(["Teacher"]),
  quizCtrl.createFull.bind(quizCtrl)
);

// Update quiz
router.put(
  "/:id",
  authMiddleware,
  authorize(["Teacher"]),
  quizCtrl.update.bind(quizCtrl)
);

// Delete quiz
router.delete(
  "/:id",
  authMiddleware,
  authorize(["Teacher"]),
  quizCtrl.delete.bind(quizCtrl)
);

/* ============================
   👑 ADMIN ROUTES
============================ */

// Analytics
router.get(
  "/analytics",
  authMiddleware,
  authorize(["Admin"]),
  quizCtrl.analytics.bind(quizCtrl)
);

export default router;
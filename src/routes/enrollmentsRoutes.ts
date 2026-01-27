import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollmentsController";
import { EnrollmentRepository } from "../repositories/enrollments.repository";
// import pool from "../config/db"; // Adjust path to your DB config
import { pool } from "../config/db";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/access.middleware";

const router = Router();
const repository = new EnrollmentRepository(pool);
const controller = new EnrollmentController(repository);

// Prefix: /api/courses/enrollments
router.get("/data", authMiddleware, authorize(['Admin']), controller.fetchEnrollmentData.bind(controller));
router.post("/add", authMiddleware, authorize(['Admin']), controller.enrollStudent.bind(controller));
router.post("/remove", authMiddleware, authorize(['Admin']), controller.removeEnrollment.bind(controller));

export default router;
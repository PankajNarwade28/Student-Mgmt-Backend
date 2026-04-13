// src/routes/scheduleRoutes.ts
import { Router } from "express";
import { ScheduleController } from "../controllers/scheduleController";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { pool } from "../config/db";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/access.middleware";

const router = Router();

// 1. Dependency Injection (Manual instantiation for reference)
const scheduleRepo = new ScheduleRepository(pool);
const scheduleCtrl = new ScheduleController(scheduleRepo);


router.get(
  '/registry',
  authMiddleware,
  authorize(['Admin', 'Teacher', 'Student']),
  scheduleCtrl.getRegistry.bind(scheduleCtrl)
); 
router.post(
  '/session/start',
  authMiddleware,
  authorize(['Teacher']),
  scheduleCtrl.startSession.bind(scheduleCtrl)
);

export default router;
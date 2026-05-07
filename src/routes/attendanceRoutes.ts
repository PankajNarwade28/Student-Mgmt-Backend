import { Router } from "express";
import { container } from "../config/inversify.config";
import { AttendanceController } from "../controllers/attendanceController";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/access.middleware";

const router = Router();
const controller = container.get<AttendanceController>(AttendanceController);

// Teacher Routes
router.post(
  "/teacher/submit", 
  authMiddleware, 
  authorize(["Teacher"]), 
  controller.submitAttendance
);

// Admin Routes
router.get(
  "/admin/global-report", 
  authMiddleware, 
  authorize(["Admin", "Teacher"]), 
  controller.getGlobalReport
);

// Student Routes
router.get(
  "/student/my-records", 
  authMiddleware, 
  authorize(["Student"]), 
  controller.getMyAttendance
);

export default router;
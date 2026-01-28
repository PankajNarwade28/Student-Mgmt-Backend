// src/routes/adminRoutes.ts
import { AuditController } from "../controllers/auditController";
import { AuditRepository } from "../repositories/audit.repository";
import { pool } from "../config/db";
import { authorize } from "../middlewares/access.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import router from "./teacherRoutes";

// 1. Create the repository instance
const auditRepository = new AuditRepository(pool);

// 2. Create the controller instance (This is the object that has 'getLogs')
const auditController = new AuditController(auditRepository);

// 3. Now 'auditController' (lowercase) has the method
router.get(
  '/system/logs', 
  authMiddleware, 
  authorize(['Admin']), 
  auditController.getLogs.bind(auditController)
);

export default router;
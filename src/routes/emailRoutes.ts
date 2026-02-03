import { Router } from "express";
import { container } from "../config/inversify.config";
import { TYPES } from "../config/types";
import { EmailController } from "../controllers/emailController";

const router = Router();
const emailController = container.get<EmailController>(TYPES.EmailController);

// Make sure you have a route defined
router.post("/forgot-password", emailController.forgotPassword);
router.post("/reset-password",emailController.resetPassword);

// IMPORTANT: This line is likely missing or misspelled!
export default router;
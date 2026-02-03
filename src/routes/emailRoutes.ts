import { Router } from "express";
import { container } from "../config/inversify.config";
import { TYPES } from "../config/types";
import { EmailController } from "../controllers/emailController";
import { validateResetToken } from "../middlewares/validateResetToken";

const router = Router();
const emailController = container.get<EmailController>(TYPES.EmailController);

// Make sure you have a route defined
router.post("/forgot-password", emailController.forgotPassword);
router.post(
  "/reset-password",
  validateResetToken,
  emailController.resetPassword,
);
// The middleware does the heavy lifting
router.get("/verify-token/:token", validateResetToken, (req, res) => {
  // If it reaches here, the middleware found the token in the DB
  res.status(200).json({ valid: true });
});
// IMPORTANT: This line is likely missing or misspelled!
export default router;

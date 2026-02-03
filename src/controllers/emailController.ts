// controllers/AuthController.ts
import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { EmailRepository } from "../repositories/email.repository";
import { MailService } from "../services/MailService";
import { TYPES } from "../config/types";

@injectable()
export class EmailController {
  constructor(
    @inject(TYPES.EmailRepository)
    private readonly emailRepository: EmailRepository,
    @inject(MailService) private readonly mailService: MailService, // No Symbol used here based on your config
  ) {}

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await this.emailRepository.findByEmail(email);

      if (!user) return res.status(404).json({ message: "User not found" });

      const userId = user.id || user.user_id;

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000);

      await this.emailRepository.updateResetToken(userId, resetToken, expiry);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await this.mailService.sendResetEmail(email, resetLink);

      return res
        .status(200)
        .json({ message: "Reset link sent to your email." });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      // 1. Verify token and check expiry
      const user = await this.emailRepository.findByResetToken(token);

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired reset token. Please request a new link.",
        });
      }

      // 2. Hash and Update Password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.emailRepository.updatePassword(user.id, hashedPassword);

      // 3. Conditional Activation and Messaging
      if (!user.is_active) {
        // First time setting password / Account was inactive
        await this.emailRepository.updateStatus(user.id, true);

        return res.status(200).json({
          message:
            "Password reset and account activated successfully. You can now login.",
        });
      } else {
        // User was already active, just a normal password reset
        return res.status(200).json({
          message:
            "Your password has been updated successfully. Please login with your new credentials.",
        });
      }
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

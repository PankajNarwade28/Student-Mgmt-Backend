// src/controllers/authController.ts
import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../config/types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { ProfileRepository } from "../repositories/profile.repository";

const JWT_SECRET = process.env.JWT_SECRET;

//Decorator: This marks the AuthController so that the Inversify container can manage its lifecycle and dependencies
// @inject(TYPES.UserRepository) tells Inversify which specific implementation to grab from the "warehouse."

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepo: ProfileRepository,
  ) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
      const user = await this.userRepo.findByEmail(email);

      if (
        !user ||
        // !user.is_active ||   // Uncomment if you want to restrict login for inactive users in future.
        !(await bcrypt.compare(password, user.password))
      ) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET as string,
        { expiresIn: "24h" },
      );
      const profile = await this.profileRepo.getProfileByUserId(user.id);
      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
        profileCompleted: !!profile, // true if profile exists, false otherwise
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  };

  signup = async (req: Request, res: Response): Promise<void> => {
    // TypeScript now knows exactly what is in req.body thanks to Zod
    const { email, password, role } = req.body;

    try {
      // 1. Check if user exists using repo
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: "Email already registered" });
        return;
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // 3. Save using repo
      const user = await this.userRepo.createUser(
        email,
        hashedPassword,
        role || "Student",
      );
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { oldPassword, newPassword } = req.body;

      // 1. Fetch current hash and status
      const user = await this.userRepo.findPasswordAndStatusById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // 2. Verify current password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password" });
      }

      // 3. Hash new password
      const newHash = await bcrypt.hash(newPassword, 10);

      // 4. Update Password
      await this.userRepo.updatePassword(userId, newHash);

      // 5. Separate logic for Activation: Only update if currently Inactive
      let activated = false;
      if (user.is_active === false) {
        await this.userRepo.updateStatus(userId, true);
        activated = true;
      }

      return res.status(200).json({
        message: activated
          ? "Password changed and account activated!"
          : "Password updated successfully.",
      });
    } catch (error) {
      console.error("ChangePassword Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

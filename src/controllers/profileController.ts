// src/controllers/profile.controller.ts
import { Response } from "express";
import { ProfileRepository } from "../repositories/profile.repository";
import { AuthenticatedRequest } from "../interfaces/authRequest.interface";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.ProfileRepository) private profileRepo: ProfileRepository
  ) {}

  // Added this method to handle: api.get("/api/user/profile")
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const profile = await this.profileRepo.getProfileByUserId(userId);
      return res.status(200).json({ profile: profile || null });
    } catch (error) {
      console.error(`error`,error)
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async saveProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "User not authenticated" });

      const profileData = { ...req.body, user_id: userId };
      const savedProfile = await this.profileRepo.upsertProfile(profileData);
      return res.status(200).json({ profile: savedProfile });
    } catch (error) {
      console.error("Controller Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
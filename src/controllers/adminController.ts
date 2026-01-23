import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";
import { AdminRepository } from "./../repositories/admin.repository";

@injectable()
export class AdminController {

  constructor(
    @inject(TYPES.AdminRepository) private adminRepo: AdminRepository,
  ) {}

  addUser = async (req: Request, res: Response): Promise<void> => {
    const { email, role } = req.body;

    console.log("AddUser Request Body:", req.body); // DEBUG HERE
    try {
      // In your Repository or Controller
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await this.adminRepo.findByEmail(normalizedEmail);
      if (existingUser) {
        res.status(400).json({ message: "Email already registered" });
        return;
      }
      const newUser = await this.adminRepo.createUser(normalizedEmail, role || "Student");

      res.status(201).json({
        message: `User created successfully Pass: ${role}@2026`,
        user: newUser,
      });
    } catch (error) {
      console.error("AddUser Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.adminRepo.getAllUsers(); // MUST await
      console.log("Users fetched from DB:", users.length);

      res.status(200).json({
        success: true,
        users: users, // Ensure this key matches your frontend
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role, email } = req.body;
    try {
      const updatedUser = await this.adminRepo.updateUser(
        id as string,
        email.toLowerCase().trim(),
        role,  
      );
      res.status(200).json({ message: "User updated", user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  removeUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      await this.adminRepo.deleteUser(id as string);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}

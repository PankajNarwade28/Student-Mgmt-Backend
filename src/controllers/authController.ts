// src/controllers/authController.ts
import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../config/types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
// import { AuthBody } from "../validations/authSchema";

// const userRepository = new UserRepository();
const JWT_SECRET = process.env.JWT_SECRET;

// export const signup = async (req: Request, res: Response): Promise<void> => {
//   const { email, password, role } = req.body;

//   try {
//     // 1. Check if user exists using repo
//     const existingUser = await userRepo.findByEmail(email);
//     if (existingUser) {
//       res.status(400).json({ message: "Email already registered" });
//       return;
//     }

//     // 2. Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // 3. Save using repo
//     const user = await userRepo.createUser(email, hashedPassword, role || 'Student');

//     res.status(201).json({ message: "User registered successfully", user });
//   } catch (error) {
//     res.status(500).json({ error: "Registration failed" });
//   }
// };

// export const login = async (req: Request, res: Response): Promise<void> => {
//   const { email, password } = req.body;

//   try {
//     const user = await userRepo.findByEmail(email);

//     if (!user || !user.is_active || !(await bcrypt.compare(password, user.password))) {
//       res.status(401).json({ message: "Invalid email or password" });
//       return;
//     }

//     const token = jwt.sign(
//       { id: user.id, role: user.role },
//       JWT_SECRET as string,
//       { expiresIn: '24h' }
//     );

//     res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
//   } catch (error) {
//     res.status(500).json({ error: "Login failed" });
//   }
// };


//Decorator: This marks the AuthController so that the Inversify container can manage its lifecycle and dependencies
// @inject(TYPES.UserRepository) tells Inversify which specific implementation to grab from the "warehouse."

@injectable() 
export class AuthController {
  constructor(@inject(TYPES.UserRepository) private userRepo: UserRepository) {}
  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
      const user = await this.userRepo.findByEmail(email);

      if (
        !user ||
        !user.is_active ||
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

      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  };

  signup= async (req: Request, res: Response): Promise<void> => {
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
    const user = await this.userRepo.createUser(email, hashedPassword, role || 'Student');

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

}

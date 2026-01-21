// src/middlewares/auth.validation.ts
import { Request, Response, NextFunction } from 'express';

// Middleware for Signup Validation
export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, role } = req.body;
  const errors: string[] = [];

  // 1. Check Email
  if (!email || !email.includes('@')) {
    errors.push("A valid email is required.");
  }

  // 2. Check Password
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  // 3. Optional Role Check
  if (role && !['Student', 'Admin','Teacher'].includes(role)) {
    errors.push("Role must be either Student, Admin, or Teacher.");
  }

  // If there are errors, stop the request here
  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', messages: errors });
  }

  // If everything is fine, move to the controller
  next();
};

// Middleware for Login Validation
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  const errors: string[] = [];

  // Email validation
  if (!email) {
    errors.push("Email is required");
  } else if (!email.includes("@") || !email.includes(".")) {
    errors.push("Invalid email format");
  }

  // Password validation
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors,
    });
  }

  // Proceed if valid
  next();
};

import { Request, Response, NextFunction } from 'express';
// Middleware for data validation when an admin adds a new user

export const validateAdminAddUser = (req: Request, res: Response, next: NextFunction) => {
  const { email, role } = req.body;
  const errors: string[] = [];

  // 1. Check Email - Normalize to lowercase for consistency
  if (!email || !email.includes('@')) {
    errors.push("A valid email is required.");
  }

  // 2. Role Check
  // Ensuring role exists and matches allowed types
  if (!role || !['Student', 'Admin', 'Teacher'].includes(role)) {
    errors.push("Role is required and must be either Student, Admin, or Teacher.");
  }

  // If there are errors, stop the request here
  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', messages: errors });
  }

  // If everything is fine, move to the controller
  next();
};
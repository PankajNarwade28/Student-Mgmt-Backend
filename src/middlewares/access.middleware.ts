// src/middlewares/accessControl.middleware.ts
import { Request, Response, NextFunction } from "express";

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Check if user information exists (set by the Auth/JWT middleware)
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized: No user found" });
      }

      // 2. Check if the user's role is in the list of allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message:
            "Forbidden: You do not have permission to access this route.",
        });
      }

      // ✅ If everything is fine, proceed with your actual logic
      return res.status(200).json({ message: "Access granted!" });
    } catch (error) {
      console.error("Error in secure-route:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    // 3. User is authorized, proceed to the controller
    next();
  };
};

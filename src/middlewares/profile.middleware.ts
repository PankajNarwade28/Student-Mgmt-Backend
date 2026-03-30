import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const upsertProfileSchema = z.object({
  // user_id often comes from req.user (JWT), but if it's in the body:
  user_id: z.uuid("Invalid User ID format"), 
  first_name: z.string().min(2, "First name is too short"),
  last_name: z.string().min(2, "Last name is too short"),
  date_of_birth: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  phone_number: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
});

// The Middleware Function
export const validateProfileUpsert = (req: Request, res: Response, next: NextFunction) => {
  try {
    // We combine the body and potentially the user_id from the auth middleware
    const dataToValidate = {
      ...req.body,
      user_id: req.body.user_id || (req as any).user?.id 
    };

    upsertProfileSchema.parse(dataToValidate);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        message: error.issues[0]?.message || "Validation error during profile update", // Returns the first validation error
        details: error.issues
      });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};
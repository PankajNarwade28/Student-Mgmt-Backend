// middlewares/validateResetToken.ts
import { Request, Response, NextFunction } from "express";
import { container } from "../config/inversify.config";
import { EmailRepository } from "../repositories/email.repository";
import { TYPES } from "../config/types";

export const validateResetToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Token can come from params (GET) or body (POST)
        const token = req.params.token || req.body.token;

        if (!token) {
            return res.status(400).json({ message: "Reset token is missing." });
        }

        const emailRepo = container.get<EmailRepository>(TYPES.EmailRepository);
        
        // Check if token exists and is not expired
        const user = await emailRepo.findByResetToken(token);

        if (!user) {
            return res.status(401).json({ 
                message: "This reset link is invalid or has expired. Please request a new one." 
            });
        }
 
        next();
    } catch (error) {
        console.error("Middleware Error:", error);
        res.status(500).json({ message: "Internal server error during validation." });
    }
};
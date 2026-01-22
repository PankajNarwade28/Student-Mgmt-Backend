// src/interfaces/authRequest.interface.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;             // The logged-in user's UUID
    role: string;           // Student, Teacher, or Admin
  };
}
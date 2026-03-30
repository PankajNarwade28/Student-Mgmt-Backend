// src/controllers/auditController.ts
import { Request, Response } from "express";
import { AuditRepository } from "../repositories/audit.repository";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types"; // Ensure you import your types

@injectable()
export class AuditController {
  constructor(
    @inject(TYPES.AuditRepository) private readonly repository: AuditRepository
  ) {}

  getLogs = async (req: Request, res: Response) => {
    try {
      // 1. Extract query parameters with defaults
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 10;

      // 2. Fetch paginated data from repository
      // Ensure you update your repository method to accept these arguments
      const result = await this.repository.getLogsPaged(page, limit);

      // 3. Return a consistent object structure
      // Your frontend is likely failing because it expects an array 
      // but is now getting a metadata object (or vice versa).
      res.status(200).json({
        items: result.data,
        total: result.total,
        page,
        limit
      });
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Error fetching audit logs" });
    }
  };
}

export default AuditController;
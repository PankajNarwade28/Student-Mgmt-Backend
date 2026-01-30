// src/controllers/auditController.ts
import { Request, Response } from "express";
import { AuditRepository } from "../repositories/audit.repository";
import { injectable } from "inversify";

@injectable()
export class AuditController {
  constructor(private readonly repository: AuditRepository) {}

  getLogs = async (req: Request, res: Response) => {
    try {
      const logs = await this.repository.getAllLogs();
      res.status(200).json(logs);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Error fetching audit logs" });
    }
  };
}

export default AuditController;
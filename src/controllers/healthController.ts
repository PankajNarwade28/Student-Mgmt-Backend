import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";
import { StudentRepository } from "../repositories/student.repository";

@injectable()
export class HealthController {
  constructor(  
    @inject(TYPES.StudentRepository) private readonly studentRepo: StudentRepository
  ) {}

  checkHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentCount = await this.studentRepo.getTotalStudentCount();
      res.json({database: true,backend: true,message: "All systems operational", totalStudents: studentCount, status: "UP" });
    } catch (err) {
      next(err);
    }
  };
}
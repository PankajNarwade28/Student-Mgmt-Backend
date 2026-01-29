// src/controllers/request.controller.ts
import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";
import { RequestRepository } from "../repositories/request.repository";

// src/controllers/request.controller.ts
@injectable()
export class RequestController {
  constructor(
    @inject(TYPES.RequestRepository)
    private readonly requestRepo: RequestRepository,
  ) {}

  getRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.requestRepo.getAllDetailedRequests();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  // handleDecision = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { id } = req.params;
  //     const { action, student_id, course_id } = req.body;

  //     if (action === "ACCEPT") {
  //       await this.requestRepo.acceptAndEnroll(
  //         Number(id),
  //         student_id,
  //         course_id,
  //       );
  //       res.json({ message: "Student enrolled and request cleared" });
  //     } else {
  //       await this.requestRepo.rejectAndDelete(Number(id));
  //       res.json({ message: "Request rejected successfully" });
  //     }
  //   } catch (err) {
  //     next(err);
  //   }
  // };

  // src/controllers/request.controller.ts

  handleDecision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action, student_id, course_id } = req.body;

      if (action === "ACCEPT") {
        await this.requestRepo.acceptAndEnroll(
          Number(id),
          student_id,
          course_id,
        );
        res.json({ message: "Student successfully enrolled." });
      } else {
        await this.requestRepo.rejectAndDelete(Number(id));
        res.json({ message: "Request rejected." });
      }
    } catch (err: any) {
      // Catch the specific Database error
      if (err.message.includes("already enrolled")) {
        return res
          .status(400)
          .json({
            message: "This student is already enrolled in this course.",
          });
      }
      next(err);
    }
  };
}

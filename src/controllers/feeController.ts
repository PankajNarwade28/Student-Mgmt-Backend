import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { FeeRepository } from '../repositories/fee.repository';

@injectable()
export class FeeController {
  constructor(@inject(FeeRepository) private readonly feeRepository: FeeRepository) {}

  getStudentFees = async (req: Request, res: Response) => {
    try {
      const studentId = (req as any).user.id; // From your auth middleware
      const data = await this.feeRepository.getStudentEnrollmentFees(studentId);
      res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error fetching fees:", error);
      res.status(500).json({ success: false, message: "Error fetching fees" });
    }
  };

  processPayment = async (req: Request, res: Response) => {
    const { enrollmentId, amount } = req.body;
    try {
      const payment = await this.feeRepository.recordPayment(enrollmentId, amount);
      res.status(200).json({ 
        success: true, 
        message: "Payment successful. Enrollment locked.", 
        payment 
      });
    } catch (error) {
        console.error("Payment processing error:", error);
      res.status(500).json({ success: false, message: "Payment failed" });
    }
  };
}
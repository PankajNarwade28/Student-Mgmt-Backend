import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { FeeRepository } from '../repositories/fee.repository';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import * as dotenv from 'dotenv';

dotenv.config();

@injectable()
export class FeeController {
  constructor(@inject(FeeRepository) private readonly feeRepository: FeeRepository) {}

  /**
   * Helper function to get Razorpay instance.
   * This ensures process.env is read only when a request is made,
   * avoiding "key_id is mandatory" errors during file load.
   */
  private getRazorpayInstance() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys are missing in .env file");
    }

    return new Razorpay({ key_id, key_secret });
  }

  getStudentFees = async (req: Request, res: Response) => {
    try {
      const studentId = (req as any).user.id; 
      const data = await this.feeRepository.getStudentEnrollmentFees(studentId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Error fetching fees:", error);
      res.status(500).json({ success: false, message: "Error fetching fees" });
    }
  };

  // 1. Create Razorpay Order
  createOrder = async (req: Request, res: Response) => {
    const { amount } = req.body; 
    try {
      const rzp = this.getRazorpayInstance(); // Call helper here
      const options = {
        amount: Math.round(Number(amount) * 100), // Ensure it's a number and convert to paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      
      const order = await rzp.orders.create(options);
      res.status(200).json({ success: true, order });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ success: false, message: "Order creation failed" });
    }
  };

// 2. Verify Payment & Lock Course
verifyPayment = async (req: Request, res: Response) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature, 
    enrollmentId, 
    amount 
  } = req.body;

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      console.error("CRITICAL: RAZORPAY_KEY_SECRET is missing in .env");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    // 1. Construct the verification string
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    // 2. Debug Logs (Check these in your terminal)
    console.log("Generated:", generated_signature);
    console.log("Received:", razorpay_signature);

    // 3. Compare
    if (generated_signature === razorpay_signature) {
      // Success: Save to Database
      await this.feeRepository.recordPayment(
        enrollmentId, 
        amount, 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature
      );
      
      return res.status(200).json({ success: true, message: "Payment verified" });
    } else {
      return res.status(400).json({ success: false, message: "Signature mismatch" });
    }
  } catch (error) {
    console.error("Verification Catch Block:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

processPayment = async (req: Request, res: Response) => {
    const { enrollmentId, amount } = req.body;
    try {
      const payment = await this.feeRepository.recordPayment(enrollmentId, amount, '', '', '');
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

getAllLogs = async (req: Request, res: Response) => {
  try {
    const transactions = await this.feeRepository.getAllTransactions();
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};
}
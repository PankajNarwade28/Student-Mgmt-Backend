import { Router } from 'express';
import { container } from '../config/inversify.config';
import { FeeController } from '../controllers/feeController'; 
import { authorize } from '../middlewares/access.middleware';
import { authMiddleware } from '../middlewares/auth.middleware'; // Ensure this is imported

const feeRouter = Router();

// Resolve the controller from the container
const feeController = container.get<FeeController>(FeeController);

/**
 * STUDENT ROUTES
 * Using authMiddleware to ensure req.user exists for studentId
 */

// 1. Get Fee Status for the logged-in student
feeRouter.get(
  '/my-fees',
  authMiddleware,
  authorize(["Student", "Admin"]), // Admins might want to see this too
  feeController.getStudentFees.bind(feeController)
);

// 2. Create Razorpay Order
feeRouter.post(
  '/create-order',
  authMiddleware,
  authorize(["Student"]),
  feeController.createOrder.bind(feeController)
);

// 3. Verify Payment and Lock Enrollment
feeRouter.post(
  '/verify-payment',
  authMiddleware,
  authorize(["Student"]),
  feeController.verifyPayment.bind(feeController)
);

/**
 * ADMIN/GENERAL ROUTES
 */

// 4. Manual/Legacy Process Payment (If needed)
feeRouter.post(
  '/pay-fee',
  authMiddleware,
  authorize(["Admin"]),
  feeController.processPayment.bind(feeController)
);

// Only Admins should see the full transaction history
feeRouter.get(
  '/admin/transactions',
  authMiddleware,
  authorize(["Admin"]),
  feeController.getAllLogs.bind(feeController)
);
export default feeRouter;
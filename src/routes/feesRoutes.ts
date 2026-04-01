import { Router } from 'express';
import { container } from '../config/inversify.config';
import { FeeController } from '../controllers/feeController'; 

const feeRouter = Router();

// Reference to the resolve function instead of immediate container.get()
// This prevents the "No bindings found" crash during app startup
const getController = () => container.get<FeeController>(FeeController);


// 1. Get Fee Status
feeRouter.get('/my-fees',  (req, res) => 
  getController().getStudentFees(req, res)
);

// 2. Process Payment
feeRouter.post('/pay-fee',  (req, res) => 
  getController().processPayment(req, res)
);

export default feeRouter;
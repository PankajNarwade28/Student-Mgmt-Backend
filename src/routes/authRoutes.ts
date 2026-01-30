import { Router } from 'express'; 
import { TYPES } from '../config/types';
import { container } from '../config/inversify.config';
import { AuthController } from '../controllers/authController';
import { authMiddleware, validateLogin, validateSignup } from '../middlewares/auth.middleware';
import { AdminController } from '../controllers/adminController'; 

const router: Router = Router();


const authController = container.get<AuthController>(TYPES.AuthController);
const { signup, login } = authController;
// Define the controller from your Inversify container
const adminController = container.get<AdminController>(TYPES.AdminController);

// Endpoint: POST /api/auth/login
router.post('/login', validateLogin,login);
// This results in POST /api/auth/signup
router.post('/signup',validateSignup, signup);
// Inside your auth routes file
router.patch(
  "/change-password", 
  authMiddleware, 
  authController.changePassword.bind(authController)
);

export default router;
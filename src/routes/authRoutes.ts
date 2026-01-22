import { Router } from 'express';
// import { signup, login } from '../controllers/authController';
import { TYPES } from '../config/types';
import { container } from '../config/inversify.config';
import { AuthController } from '../controllers/authController';
import { validateLogin, validateSignup } from '../middlewares/auth.middleware';
import { AdminController } from '../controllers/adminController';
// import { authorize } from '../middlewares/access.middleware';

const router: Router = Router();


const authController = container.get<AuthController>(TYPES.AuthController);
const { signup, login } = authController;
// Define the controller from your Inversify container
const adminController = container.get<AdminController>(TYPES.AdminController);

// Endpoint: POST /api/auth/login
router.post('/login', validateLogin,login);
// This results in POST /api/auth/signup
router.post('/signup',validateSignup, signup);


export default router;
import { Router } from 'express';
// import { signup, login } from '../controllers/authController';
import { TYPES } from '../config/types';
import { container } from '../config/inversify.config';
import { AuthController } from '../controllers/authController';

const router: Router = Router();


const authController = container.get<AuthController>(TYPES.AuthController);
const { signup, login } = authController;

// Endpoint: POST /api/auth/login
router.post('/login', login);
// This results in POST /api/auth/signup
router.post('/signup', signup);
export default router;
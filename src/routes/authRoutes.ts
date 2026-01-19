import { Router } from 'express';
import { signup, login } from '../controllers/authController';
const router: Router = Router();

 

// Endpoint: POST /api/auth/login
router.post('/login', login);
// This results in POST /api/auth/signup
router.post('/signup', signup);
export default router;
import express from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { AdminController } from './../controllers/adminController';
// import { validateUserCreation } from '../middlewares/admin.middleware';

const router = express.Router();

// Resolve the controller from the container
const adminController = container.get<AdminController>(TYPES.AdminController);

// Define the route
router.post('/adduser', adminController.addUser);
router.get('/users', adminController.getUsers);

export default router;
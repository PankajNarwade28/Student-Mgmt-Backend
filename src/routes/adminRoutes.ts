import express from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { AdminController } from './../controllers/adminController';
import { authorize } from '../middlewares/access.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateAdminAddUser } from '../middlewares/data.validation';
// import { validateUserCreation } from '../middlewares/admin.middleware';

const router = express.Router();

// Resolve the controller from the container
const adminController = container.get<AdminController>(TYPES.AdminController);

// Define the route
router.post('/adduser',validateAdminAddUser, authMiddleware, authorize(['Admin']), adminController.addUser);
router.get('/users', adminController.getUsers);
// admin.routes.ts
router.put('/users/:id',validateAdminAddUser, authMiddleware, authorize(['Admin']), adminController.updateUser);
router.delete('/users/:id', authMiddleware, authorize(['Admin']), adminController.removeUser);

export default router;
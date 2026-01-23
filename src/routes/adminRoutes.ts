import express from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { AdminController } from './../controllers/adminController';
import { authorize } from '../middlewares/access.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateAdminAddUser } from '../middlewares/data.validation';
import { CourseController } from '../controllers/courseController'; 
import { checkCourseAssignments, validateCourseData } from '../middlewares/course.validation';
import { isValidTeacher } from '../middlewares/isValidTeacher.middleware'; 

const router = express.Router();

// Resolve the controller from the container
const adminController = container.get<AdminController>(TYPES.AdminController);

// Define the route
router.post('/adduser',validateAdminAddUser, authMiddleware, authorize(['Admin']), adminController.addUser);
router.get('/users', authMiddleware, authorize(['Admin']), adminController.getUsers);

// admin.routes.ts
router.put('/users/:id',validateAdminAddUser, authMiddleware, authorize(['Admin']),checkCourseAssignments, adminController.updateUser);
router.delete('/users/:id', authMiddleware, authorize(['Admin']),checkCourseAssignments, adminController.removeUser);

// admin.routes.ts
const courseController = container.get<CourseController>(TYPES.CourseController);

// Ensure this path matches what you put in the api.get() call above
router.get('/teachers',authMiddleware, authorize(['Admin']), courseController.getTeachers.bind(courseController)); 
router.post('/addcourse',validateCourseData, authMiddleware, authorize(['Admin']),isValidTeacher, courseController.addCourse.bind(courseController));
router.get('/courses',authMiddleware, authorize(['Admin']), courseController.getAllCourses.bind(courseController));
router.delete('/courses/:id', authMiddleware, authorize(['Admin']), courseController.deleteCourse.bind(courseController));
router.patch('/courses/:id/restore', authMiddleware, authorize(['Admin']), courseController.restoreCourse.bind(courseController));
export default router;
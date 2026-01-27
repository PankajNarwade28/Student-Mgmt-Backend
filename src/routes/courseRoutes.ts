
const express = require('express');
const router = express.Router();
import { authMiddleware } from '../middlewares/auth.middleware';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { CourseController } from '../controllers/courseController';
const courseController = container.get<CourseController>(TYPES.CourseController);

const getMyCoursesHandler = courseController.getMyCourses.bind(courseController);
router.get("/mycourses", authMiddleware, getMyCoursesHandler);
const instructorHandler = courseController.fetchInstructors.bind(courseController);

// Public or Protected route depending on your needs
// If anyone can see faculty, remove authMiddleware
router.get("/instructors", authMiddleware, instructorHandler);

export default router;
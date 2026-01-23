import { Request, Response } from 'express';
import { CourseRepository } from './../repositories/course.repository';  
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';

@injectable()
export class CourseController {
  constructor(
    // Use TYPES.CourseRepository instead of a raw string
    @inject(TYPES.CourseRepository) private repository: CourseRepository 
  ) {}
  // GET /api/admin/active-teachers
  getTeachers = async (req: Request, res: Response) => {
    try {
      const teachers = await this.repository.getActiveTeachers();
      console.log("Teachers found in DB:", teachers); // Check your terminal output
      return res.status(200).json(teachers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch teachers" });
    }
  };

  // POST /api/admin/courses
  addCourse = async (req: Request, res: Response) => {
    try {
       
      // 2. Save to database via Repository
      const newCourse = await this.repository.createCourse(req.body);
      console.log("New Course Created:", newCourse);    
      return res.status(201).json({
        message: "Course created successfully",
        course: newCourse
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
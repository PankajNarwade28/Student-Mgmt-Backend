import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types"; 
import { QuizRepository } from "../repositories/quiz.repository";

@injectable()
export class QuizController {
  constructor(
    @inject(TYPES.QuizRepository) private repo: QuizRepository
  ) {}

  // STUDENT
  getByCourse = async (req: Request, res: Response) => {
    const data = await this.repo.getByCourse(Number(req.params.courseId));
    res.json({ data });
  };

  // TEACHER
  getByTeacher = async (req: Request, res: Response) => {
    const teacherId = (req as any).user.id;
    const data = await this.repo.getByTeacher(teacherId);
    res.json({ data });
  };

  createFull = async (req: Request, res: Response) => {
    const teacherId = (req as any).user.id;
    const data = await this.repo.createFullQuiz({
      ...req.body,
      teacher_id: teacherId,
    });
    res.json(data);
  };

  update = async (req: Request, res: Response) => {
    const data = await this.repo.updateQuiz(
      Number(req.params.id),
      req.body
    );
    res.json({ data });
  };

  delete = async (req: Request, res: Response) => {
    await this.repo.deleteQuiz(Number(req.params.id));
    res.json({ message: "Deleted" });
  };

  // ADMIN
  analytics = async (req: Request, res: Response) => {
    const data = await this.repo.getAnalytics();
    res.json({ data });
  };

  // STUDENT SUBMIT
  submit = async (req: Request, res: Response) => {
    const studentId = (req as any).user.id;
    const { quizId, score } = req.body;

    const data = await this.repo.submit(studentId, quizId, score);
    res.json({ data });
  };
}
import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";
import { QuizRepository } from "../repositories/quiz.repository";

@injectable()
export class QuizController {
  constructor(@inject(TYPES.QuizRepository) private repo: QuizRepository) {}

  // STUDENT
  getByCourse = async (req: Request, res: Response) => {
    const user = (req as any).user;

    const data = await this.repo.getByCourse(
      Number(req.params.courseId),
      user.id,
      user.role,
    );

    res.json({ data });
  };

  // TEACHER
  getByTeacher = async (req: Request, res: Response) => {
    const teacherId = (req as any).user.id;
    const data = await this.repo.getCoursesByTeacher(teacherId);
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
    const data = await this.repo.updateQuiz(Number(req.params.id), req.body);
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

  getFullQuiz = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;

    // ✅ VALIDATION
    if (!rawId || isNaN(Number(rawId))) {
      return res.status(400).json({ message: "Invalid quiz id" });
    }

    const quizId = Number(rawId);
    const studentId = (req as any).user.id;

    const allowed = await this.repo.isStudentEnrolled(studentId, quizId);

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const data = await this.repo.getFullQuiz(quizId);

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching quiz" });
  }
};

  submit = async (req: Request, res: Response) => {
    try {
      const studentId = (req as any).user.id;
      const { quizId, score } = req.body;

      // 🔥 SECURITY CHECK
      const allowed = await this.repo.isStudentEnrolled(studentId, quizId);

      if (!allowed) {
        return res.status(403).json({ message: "Not allowed" });
      }
      if (await this.repo.hasAttempted(studentId, quizId)) {
        return res.status(400).json({ message: "Already attempted" });
      }

      const data = await this.repo.submit(studentId, quizId, score);

      res.json({ data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Submit failed" });
    }
  };

  getByStudent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const studentId = user.id;

    const data = await this.repo.getByStudent(studentId);
    console.log("Quizzes for student:", data);

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
};
}

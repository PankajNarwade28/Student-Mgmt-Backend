import { Pool } from "pg";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class QuizRepository {
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  // STUDENT / TEACHER
  async getByCourse(courseId: number) {
    const { rows } = await this.pool.query(
      "SELECT * FROM quizzes WHERE course_id=$1",
      [courseId]
    );
    return rows;
  }

  // TEACHER
  async getByTeacher(teacherId: string) {
    const { rows } = await this.pool.query(
      "SELECT * FROM quizzes WHERE teacher_id=$1",
      [teacherId]
    );
    return rows;
  }

  async deleteQuiz(id: number) {
    await this.pool.query("DELETE FROM quizzes WHERE id=$1", [id]);
  }

  async updateQuiz(id: number, data: any) {
    const { rows } = await this.pool.query(
      `UPDATE quizzes 
       SET title=$1, description=$2, time_limit_minutes=$3 
       WHERE id=$4 RETURNING *`,
      [data.title, data.description, data.time_limit_minutes, id]
    );
    return rows[0];
  }

  // FULL CREATE (Quiz + Questions + Options)
  async createFullQuiz(data: any) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const quizRes = await client.query(
        `INSERT INTO quizzes (course_id, teacher_id, title, description, time_limit_minutes)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [
          data.course_id,
          data.teacher_id,
          data.title,
          data.description,
          data.time_limit_minutes,
        ]
      );

      const quizId = quizRes.rows[0].id;

      for (const q of data.questions) {
        const qRes = await client.query(
          `INSERT INTO quiz_questions (quiz_id, question_text)
           VALUES ($1,$2) RETURNING id`,
          [quizId, q.question_text]
        );

        const questionId = qRes.rows[0].id;

        for (const opt of q.options) {
          await client.query(
            `INSERT INTO quiz_options (question_id, option_text, is_correct)
             VALUES ($1,$2,$3)`,
            [questionId, opt.text, opt.is_correct]
          );
        }
      }

      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // ADMIN ANALYTICS
  async getAnalytics() {
    const { rows } = await this.pool.query(`
      SELECT 
        q.title,
        c.name as course_name,
        AVG(qs.score) as avg_score,
        COUNT(qs.id) as total_attempts
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      LEFT JOIN quiz_submissions qs ON q.id = qs.quiz_id
      GROUP BY q.id, c.name
    `);
    return rows;
  }

  // STUDENT SUBMIT
  async submit(studentId: string, quizId: number, score: number) {
    const { rows } = await this.pool.query(
      `INSERT INTO quiz_submissions (student_id, quiz_id, score)
       VALUES ($1,$2,$3) RETURNING *`,
      [studentId, quizId, score]
    );
    return rows[0];
  }
}

export default QuizRepository;
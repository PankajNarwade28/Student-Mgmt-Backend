import { Pool } from "pg";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";

@injectable()
export class QuizRepository {
  constructor(@inject(TYPES.DbPool) private pool: Pool) {}

  // STUDENT / TEACHER
  async getByCourse(courseId: number, userId: string, role: string) {
    let query = "";
    let values: any[] = [];

    if (role === "Teacher") {
      // Teacher can only access own courses
      query = `
      SELECT q.* FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE q.course_id = $1 AND c.teacher_id = $2
    `;
      values = [courseId, userId];
    } else {
      // Student → only enrolled courses
      query = `
      SELECT q.* FROM quizzes q
      JOIN enrollments e ON e.course_id = q.course_id
      WHERE q.course_id = $1 AND e.student_id = $2
    `;
      values = [courseId, userId];
    }

    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  // TEACHER
  // COURSE REPO (or inside same repo if needed)
  async getCoursesByTeacher(teacherId: string) {
    const { rows } = await this.pool.query(
      `
    SELECT 
      id,
      name,
      code
    FROM courses
    WHERE teacher_id = $1
    ORDER BY name ASC
    `,
      [teacherId],
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
      [data.title, data.description, data.time_limit_minutes, id],
    );
    return rows[0];
  }

  // FULL CREATE (Quiz + Questions + Options)
  async createFullQuiz(data: any) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // ✅ CHECK: teacher owns the course
      const check = await client.query(
        `SELECT * FROM courses WHERE id=$1 AND teacher_id=$2`,
        [data.course_id, data.teacher_id],
      );

      if (check.rows.length === 0) {
        throw new Error("Unauthorized: You cannot create quiz for this course");
      }

      // Insert quiz
      const quizRes = await client.query(
        `INSERT INTO quizzes (course_id, teacher_id, title, description, time_limit_minutes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [
          data.course_id,
          data.teacher_id,
          data.title,
          data.description,
          data.time_limit_minutes,
        ],
      );

      const quizId = quizRes.rows[0].id;

      for (const q of data.questions) {
        const qRes = await client.query(
          `INSERT INTO quiz_questions (quiz_id, question_text)
         VALUES ($1,$2) RETURNING id`,
          [quizId, q.question_text],
        );

        const questionId = qRes.rows[0].id;

        for (const opt of q.options) {
          await client.query(
            `INSERT INTO quiz_options (question_id, option_text, is_correct)
           VALUES ($1,$2,$3)`,
            [questionId, opt.text, opt.is_correct],
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

  // GET FULL QUIZ
  async getFullQuiz(quizId: number) {
    const { rows } = await this.pool.query(
      `
    SELECT 
      q.id,
      q.title,
      q.time_limit_minutes,
      json_agg(
        json_build_object(
          'id', qq.id,
          'question_text', qq.question_text,
          'options', (
            SELECT json_agg(
              json_build_object(
                'id', qo.id,
                'option_text', qo.option_text,
                'is_correct', qo.is_correct
              )
            )
            FROM quiz_options qo
            WHERE qo.question_id = qq.id
          )
        )
      ) AS questions
    FROM quizzes q
    JOIN quiz_questions qq ON qq.quiz_id = q.id
    WHERE q.id = $1
    GROUP BY q.id
    `,
      [quizId],
    );

    return rows[0];
  }

  // CHECK STUDENT ACCESS
  async isStudentEnrolled(studentId: string, quizId: number) {
    const { rows } = await this.pool.query(
      `
    SELECT 1
    FROM quizzes q
    JOIN enrollments e ON e.course_id = q.course_id
    WHERE q.id = $1 AND e.student_id = $2
    `,
      [quizId, studentId],
    );

    return rows.length > 0;
  }

  // SUBMIT QUIZ
  async submit(studentId: string, quizId: number, score: number) {
    const { rows } = await this.pool.query(
      `
    INSERT INTO quiz_submissions (student_id, quiz_id, score)
    VALUES ($1,$2,$3)
    RETURNING *
    `,
      [studentId, quizId, score],
    );

    return rows[0];
  }
  async hasAttempted(studentId: string, quizId: number) {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM quiz_submissions WHERE student_id=$1 AND quiz_id=$2`,
      [studentId, quizId],
    );
    return rows.length > 0;
  }

 async getByStudent(studentId: string) {
  const { rows } = await this.pool.query(
    `
    SELECT 
      q.id,
      q.title,
      q.time_limit_minutes,
      c.name AS course_name,
      c.id AS course_id,

      EXISTS (
        SELECT 1 
        FROM quiz_submissions qs 
        WHERE qs.quiz_id = q.id 
        AND qs.student_id = $1
      ) AS attempted

    FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    JOIN enrollments e ON e.course_id = c.id

    WHERE e.student_id = $1

    ORDER BY q.created_at DESC
    `,
    [studentId]
  );

  return rows;
}
 
}

export default QuizRepository;

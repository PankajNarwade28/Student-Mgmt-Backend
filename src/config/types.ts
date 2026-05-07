import { QuizController } from "../controllers/quizController";
import QuizRepository from "../repositories/quiz.repository";
import { AttendanceController } from "../controllers/attendanceController";

 

export const TYPES = {
  // 1. Infrastructure
  DbPool: Symbol.for("DbPool"),

  // 2. Identity & Access (Auth & Users)
  UserRepository: Symbol.for("UserRepository"),
  AuthController: Symbol.for("AuthController"),
  ProfileRepository: Symbol.for("ProfileRepository"),
  ProfileController: Symbol.for("ProfileController"),

  // 3. Admin & Governance
  AdminController: Symbol.for("AdminController"),
  AdminRepository: Symbol.for("AdminRepository"),
  AuditRepository: Symbol.for("AuditRepository"),
  AuditController: Symbol.for("AuditController"),

  // 4. Academic Management (Courses & Faculty)
  CourseController: Symbol.for("CourseController"),
  CourseRepository: Symbol.for("CourseRepository"),
  TeacherRepository: Symbol.for("TeacherRepository"),
  TeacherController: Symbol.for("TeacherController"),
  StudentRepository: Symbol.for("StudentRepository"),

  // 5. Enrollment & Lifecycle
  RequestRepository: Symbol.for("RequestRepository"),
  RequestController: Symbol.for("RequestController"),
  EnrollmentRepository: Symbol.for("EnrollmentRepository"),
  EnrollmentController: Symbol.for("EnrollmentController"),

  // 6. Miscellaneous / Specialized
  HealthRepository: Symbol.for("HealthRepository"),
  HealthController: Symbol.for("HealthController"),
  EmailController: Symbol.for("EmailController"),
  EmailRepository: Symbol.for("EmailRepository"),
  
// 7. Fees & Payments
  FeeRepository: Symbol.for("FeeRepository"),
  FeeController: Symbol.for("FeeController"),

// 8. Coupons
  CouponRepository: Symbol.for("CouponRepository"),
  CouponController: Symbol.for("CouponController"),

  // 9. Schedule
  ScheduleRepository: Symbol.for("ScheduleRepository"),
  ScheduleController: Symbol.for("ScheduleController"),

  // 10. Quiz
  QuizController : Symbol.for("QuizController"),
  QuizRepository : Symbol.for("QuizRepository"),

  // 11. Attendance
  AttendanceRepository : Symbol.for("AttendanceRepository"),
  AttendanceController  : Symbol.for("AttendanceController"),
};

export type TYPES = typeof TYPES;

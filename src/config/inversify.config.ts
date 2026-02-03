import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { pool } from "./db";
import { Pool } from "pg";

// Repositories
import { UserRepository } from "../repositories/user.repository";
import { HealthRepository } from "../repositories/health.repository";
import { StudentRepository } from "../repositories/student.repository";
import { AdminRepository } from "../repositories/admin.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { CourseRepository } from "../repositories/course.repository";
import { AuditRepository } from "../repositories/audit.repository";

// Controllers
import { AuthController } from "../controllers/authController";
import { HealthController } from "../controllers/healthController";
import { AdminController } from "../controllers/adminController";
import { ProfileController } from "../controllers/profileController";
import { CourseController } from "../controllers/courseController";
import { AuditController } from "../controllers/auditController";
import { RequestController } from "../controllers/requestController";
import { RequestRepository } from "../repositories/request.repository";
import { EnrollmentRepository } from "../repositories/enrollments.repository";
import { EnrollmentController } from "../controllers/enrollmentsController";
import { EmailController } from "../controllers/emailController";
import { EmailRepository } from "../repositories/email.repository";
import { MailService } from "../services/MailService";

const container = new Container();

// 1. Bind Database Pool
container.bind<Pool>(TYPES.DbPool).toConstantValue(pool);

// 2. Bind All Repositories (Singleton Scope)
container
  .bind<UserRepository>(TYPES.UserRepository)
  .to(UserRepository)
  .inSingletonScope();
container
  .bind<HealthRepository>(TYPES.HealthRepository)
  .to(HealthRepository)
  .inSingletonScope();
container
  .bind<StudentRepository>(TYPES.StudentRepository)
  .to(StudentRepository)
  .inSingletonScope();
container
  .bind<AdminRepository>(TYPES.AdminRepository)
  .to(AdminRepository)
  .inSingletonScope();
container
  .bind<ProfileRepository>(TYPES.ProfileRepository)
  .to(ProfileRepository)
  .inSingletonScope();
container
  .bind<CourseRepository>(TYPES.CourseRepository)
  .to(CourseRepository)
  .inSingletonScope();
container
  .bind<AuditRepository>(TYPES.AuditRepository)
  .to(AuditRepository)
  .inSingletonScope();
container
  .bind<RequestRepository>(TYPES.RequestRepository)
  .to(RequestRepository)
  .inSingletonScope();
container
  .bind<EnrollmentRepository>(TYPES.EnrollmentRepository)
  .to(EnrollmentRepository)
  .inSingletonScope();

// 3. Bind All Controllers (Singleton Scope)
container
  .bind<AuthController>(TYPES.AuthController)
  .to(AuthController)
  .inSingletonScope();
container
  .bind<HealthController>(TYPES.HealthController)
  .to(HealthController)
  .inSingletonScope();
container
  .bind<AdminController>(TYPES.AdminController)
  .to(AdminController)
  .inSingletonScope();
container
  .bind<ProfileController>(TYPES.ProfileController)
  .to(ProfileController)
  .inSingletonScope();
container
  .bind<CourseController>(TYPES.CourseController)
  .to(CourseController)
  .inSingletonScope();
container
  .bind<AuditController>(TYPES.AuditController)
  .to(AuditController)
  .inSingletonScope();
container
  .bind<RequestController>(TYPES.RequestController)
  .to(RequestController)
  .inSingletonScope();
container
  .bind<EnrollmentController>(TYPES.EnrollmentController)
  .to(EnrollmentController)
  .inSingletonScope();
// Repositories
container
  .bind<EmailRepository>(TYPES.EmailRepository)
  .to(EmailRepository)
  .inSingletonScope();

// Controllers
container
  .bind<EmailController>(TYPES.EmailController)
  .to(EmailController)
  .inSingletonScope();

// Services (If not using a Symbol for MailService)
container.bind<MailService>(MailService).toSelf().inSingletonScope();
export { container };

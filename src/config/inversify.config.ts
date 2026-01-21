import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { UserRepository } from "../repositories/user.repository";
import { HealthRepository } from "../repositories/health.repository";
import { StudentRepository } from "../repositories/student.repository";
import { AuthController } from "../controllers/authController";
import { pool } from "./db";
import { Pool } from "pg";
import { HealthController } from "../controllers/healthController";

const container = new Container();
// Bind the actual pool instance (Singleton)
container.bind<Pool>(TYPES.DbPool).toConstantValue(pool);

// Bind the Repository
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<HealthRepository>(TYPES.HealthRepository).to(HealthRepository).inSingletonScope();
container.bind<StudentRepository>(TYPES.StudentRepository).to(StudentRepository).inSingletonScope();

// Bind the Controller
container.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();
container.bind<HealthController>(TYPES.HealthController).to(HealthController).inSingletonScope();

export { container };


// bind the classes in a central config file.
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
import { AdminController } from "../controllers/adminController";
import { AdminRepository } from "../repositories/admin.repository";
import { ProfileRepository } from "../repositories/profile.repository";

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

// Bind Repository and Controller
container.bind<AdminRepository>(TYPES.AdminRepository).to(AdminRepository).inSingletonScope();
container.bind<AdminController>(TYPES.AdminController).to(AdminController).inSingletonScope();
container.bind<ProfileRepository>(TYPES.ProfileRepository).to(ProfileRepository).inSingletonScope();

import { ProfileController } from "../controllers/profileController";
container.bind<ProfileController>(TYPES.ProfileController).to(ProfileController).inSingletonScope();

const healthController = container.get<HealthController>(TYPES.HealthController);
const healthRepo = container.get<HealthRepository>(TYPES.HealthRepository);


export { container };


// bind the classes in a central config file.
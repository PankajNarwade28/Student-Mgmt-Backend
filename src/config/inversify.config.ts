import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { UserRepository } from "../repositories/user.repository";
import { AuthController } from "../controllers/authController";

const container = new Container();

// Bind the Repository
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();

// Bind the Controller
container.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();

export { container };


// bind the classes in a central config file.
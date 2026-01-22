
export const TYPES = {
    DbPool: Symbol.for("DbPool"),
    UserRepository: Symbol.for('UserRepository'),
    StudentRepository: Symbol.for('StudentRepository'),
    HealthRepository: Symbol.for('HealthRepository'),
    AuthController: Symbol.for('AuthController'),
    HealthController: Symbol.for('HealthController'),
    AdminController: Symbol.for("AdminController"),
    AdminRepository: Symbol.for("AdminRepository"),
    ProfileRepository: Symbol.for("ProfileRepository"),
    ProfileController: Symbol.for("ProfileController"),
};
export type TYPES = typeof TYPES;
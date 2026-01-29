
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
   CourseController: Symbol.for("CourseController"),
    CourseRepository: Symbol.for("CourseRepository"),
    AuditRepository: Symbol.for("AuditRepository"),
    AuditController: Symbol.for("AuditController"),
    TeacherRepository: Symbol.for("TeacherRepository"),
    TeacherController: Symbol.for("TeacherController"),
    RequestRepository: Symbol.for("RequestRepository"),
    RequestController: Symbol.for("RequestController"),
};
export type TYPES = typeof TYPES;
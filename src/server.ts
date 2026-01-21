import "reflect-metadata"; 
import * as dotenv from "dotenv";
import path from 'path';

// 1. THIS MUST BE FIRST - Before any repositories or routes are imported
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// STEP 2: NOW IMPORT EVERYTHING ELSE
import express from "express";
import type { Request, Response, NextFunction, Application } from "express"; 
import cors from "cors";
import { StudentRepository } from './repositories/student.repository';
import { HealthRepository } from './repositories/health.repository';
import authRoutes from "./routes/authRoutes";
import { authorize } from "./middlewares/access.middleware";
import { TYPES } from "./config/types";
import { container } from "./config/inversify.config";
import { HealthController } from "./controllers/healthController";

// STEP 3: INITIALIZE REPOS AFTER ENV IS LOADED
// const studentRepo = new StudentRepository();
const healthRepo = new HealthRepository();

const app: Application = express(); 
const PORT = process.env.PORT || 3000;
 

// 2. Debugging: Check what is actually being loaded
const rawOrigins = process.env.ALLOWED_ORIGINS || "";
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

console.log("[server]: Allowed Origins:", allowedOrigins);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // !origin allows tools like Postman/Insomnia
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS Blocked]: Origin ${origin} is not in`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// 3. Apply ONLY this one CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Student Management System API');
});

 
app.use('/api/auth', authRoutes);


// app.get("/health", async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // 1. Resolve the repository from the Inversify container
//     // This ensures 'pool' is automatically injected without the "argument not provided" error
//     const studentRepo = container.get<StudentRepository>(TYPES.StudentRepository);

//     // 2. Execute the database logic
//     const studentCount = await studentRepo.getTotalStudentCount();

//     // 3. Send the successful response
//     res.json({
//       backend: true,
//       database: true,
//       totalStudents: studentCount,
//       message: "All systems operational",
//       timestamp: new Date().toISOString(),
//     });
//   } catch (err) {
//     // Pass any error to centralized error middleware
//     next(err);
//   }
// });

// using HealthController for /health route
const healthController = container.get<HealthController>(TYPES.HealthController);
app.get("/health", healthController.checkHealth);

// const studentController = container.get<StudentRepository>(TYPES.StudentRepository);
// app.get("/students/stats", studentController.getTotalStudentCount.bind(studentController));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        // backend: true,
        // database: false,
        totalStudents: "N/A",
        status: "error",
        message: err.message || "Internal Server Error",    });
});  

// 4. Start Server
app.listen(PORT, () => {
    // console.log(`[server]: Server is running at http://localhost:${PORT}`); //use env
    console.log(`[server]: Server is running at ${process.env.BASE_URL}:${PORT}`);
    console.log(`[server]: Mode: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
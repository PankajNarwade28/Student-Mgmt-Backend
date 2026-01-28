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
import { authMiddleware } from "./middlewares/auth.middleware"; 

 

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Admin Routes with auth and authorization middleware
const adminRoutes = require('./routes/adminRoutes').default;
app.use('/api/admin',authMiddleware, authorize(['Admin']),adminRoutes );

// User Routes with auth middleware
const userRoutes = require('./routes/userRoutes').default;
app.use('/api/user', authMiddleware, userRoutes );
import courseRoutes from './routes/courseRoutes';
app.use('/api/courses',authMiddleware,  courseRoutes );
app.use('/api/teacher', authMiddleware, require('./routes/teacherRoutes').default);

// using HealthController for /health route
const healthController = container.get<HealthController>(TYPES.HealthController);
container.get<HealthRepository>(TYPES.HealthRepository);
app.get("/health", healthController.checkHealth);


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        // backend: true,
        // database: false,
        totalStudents: "N/A",
        status: "error",
        message: err.message || "Internal Server Error",    });
});  

// 2. 404 Redirect Middleware
app.use((req, res) => {
    // Redirects any unmatched request to the root path
    res.send('Route not found. Please check the URL or refer to the API documentation.'); 
});


// 4. Start Server
app.listen(PORT, () => {
    // console.log(`[server]: Server is running at http://localhost:${PORT}`); //use env
    console.log(`[server]: Server is running at ${process.env.BASE_URL}:${PORT}`);
    console.log(`[server]: Mode: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
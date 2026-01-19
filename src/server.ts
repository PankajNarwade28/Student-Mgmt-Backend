import "reflect-metadata"; 
// llows TypeScript to store and read metadata about classes and functions using Decorators used in InversifyJS and TypeORM
import express from "express";
import type { Request, Response, NextFunction, Application } from "express"; 
//type means only import the definitions not the actual code or logic
import * as dotenv from "dotenv";
import cors from "cors";
import { StudentRepository } from './repositories/student.repository';
const studentRepo = new StudentRepository();

import { HealthRepository } from './repositories/health.repository';
const healthRepo = new HealthRepository();

dotenv.config();

const app: Application = express(); 
const PORT = process.env.PORT || 3000; //

// const pool = require('./config/db').pool;  // To Study..
// import { pool } from './config/db';

// Load environment variables from .env file
dotenv.config();

// White Listing and proxy ...
 
// 1. Middlewares
app.use(express.json()); // Built-in body parser for JSON   

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173']; // Add other allowed origins as needed
const corsOptions = {
    origin: (origin: any, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS whitelisting')); // Block it
        }
    }
};

app.use(cors(corsOptions));

// cors method
 

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Student Management System API');
});

 


// app.get('/health', async (req: Request, res: Response) => {
//     let isDatabaseUp = false;
//     let studentCount: number | string = 0;
//     let statusMessage = "All systems operational";

//     try {
//         const dbStatus = await healthRepo.isDatabaseHealthy();
//         isDatabaseUp = dbStatus.healthy;

//         if (isDatabaseUp) {
//             studentCount = await studentRepo.getTotalStudentCount();
//         } else {
//             // This captures "database 'mini-projects' does not exist"
//             statusMessage = dbStatus.error || "Database connection failed";
//             studentCount = "N/A";
//         }
//     } catch (err: any) {
//         isDatabaseUp = false;
//         studentCount = "ERR";
//         statusMessage = err.message; // Captures query errors like 'sstudents' typo call next(0)
//     }

//     return res.json({
//         backend: true,
//         database: isDatabaseUp,
//         totalStudents: studentCount,
//         message: statusMessage, // This is what shows in your bottom box
//         timestamp: new Date().toISOString()
//     });

//     // Handle 
// });


//  2. Centralized Error Handling Middleware  

app.get("/health", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Throws if DB is unhealthy
    await healthRepo.isDatabaseHealthy();

    // If DB is healthy, get student count
    const studentCount = await studentRepo.getTotalStudentCount();

    res.json({
      backend: true,
      database: true,
      totalStudents: studentCount,
      message: "All systems operational",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Pass any error to centralized error middleware
    next(err);
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        backend: true,
        database: false,
        totalStudents: "N/A",
        status: "error",
        message: err.message || "Internal Server Error",    });
});  

// 4. Start Server
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log(`[server]: Mode: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
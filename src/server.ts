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
import authRoutes from "./routes/authRoutes";
const healthRepo = new HealthRepository();

dotenv.config();

const app: Application = express(); 
const PORT = process.env.PORT || 3000; //



// const pool = require('./config/db').pool;  // To Study..
// import { pool } from './config/db';

// Load environment variables from .env file
dotenv.config();
 
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

// Basic configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your React/Vite dev server URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cors(corsOptions));


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Student Management System API');
});

 
app.use('/api/auth', authRoutes);


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
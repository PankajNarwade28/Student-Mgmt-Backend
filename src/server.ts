import "reflect-metadata"; 
import express from "express";
import type { Request, Response, NextFunction, Application } from "express"; 
import * as dotenv from "dotenv";
import cors from "cors";
import { StudentRepository } from './repositories/student.repository';
const studentRepo = new StudentRepository();

import { HealthRepository } from './repositories/health.repository';
const healthRepo = new HealthRepository();

dotenv.config();

const app: Application = express(); 
const PORT = process.env.PORT || 3000; //

const pool = require('./config/db').pool;

// Load environment variables from .env file
dotenv.config();
 
// 1. Middlewares
app.use(express.json()); // Built-in body parser for JSON 
app.use(cors()); // Enable Cross-Origin Resource Sharing

// 2. Centralized Error Handling Middleware 
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: "error",
        message: err.message || "Internal Server Error",    });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Student Management System API');
});


app.get('/health', async (req, res) => {
    let isDatabaseUp = false;
    let studentCount = 0;

    try {
        await pool.query('SELECT 1');
        isDatabaseUp = true;
        // Fetch real data to verify database content access
        studentCount = await studentRepo.getTotalStudentCount();
    } catch (err) {
        isDatabaseUp = false;
    }

    res.json({
        status: isDatabaseUp ? 'UP' : 'DEGRADED',
        backend: true,
        database: isDatabaseUp,
        totalStudents: studentCount, // New field for the dashboard
        timestamp: new Date().toISOString()
    });
});
// 4. Start Server
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log(`[server]: Mode: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
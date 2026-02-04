
// services/MailService.ts
import nodemailer from 'nodemailer';
import { injectable } from 'inversify';
import 'dotenv/config'; 

@injectable()
export class MailService {
    private readonly transporter = nodemailer.createTransport({
        service: 'gmail', // or your provider
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });

    async sendResetEmail(email: string, link: string) {
        await this.transporter.sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`
        });
    }
}
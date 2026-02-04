// services/MailService.ts
import nodemailer from "nodemailer";
import { injectable } from "inversify";
import "dotenv/config";

@injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    service: "gmail", // or your provider
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  async sendResetEmail(email: string, link: string) {
    await this.transporter.sendMail({
      to: email,
      subject: "Password Reset Request",
      // html: `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Password Reset</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.08); overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#4f46e5); padding:24px; color:#ffffff;">
                <h1 style="margin:0; font-size:24px;">Reset Your Password 🔐</h1>
                <p style="margin:8px 0 0; opacity:0.9;">
                  Secure access to your account
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px;">
                <h2 style="margin-top:0; color:#111827;">Hello 👋 <span style="color:#4f46e5; font-weight:600;">${email}</span></h2>
                <p style="color:#374151; line-height:1.6;">
                  We received a request to reset your account password.  
                  Click the button below to create a new password and regain access.
                </p>

                <!-- Button -->
                <div style="text-align:center; margin:32px 0;">
                  <a href="${link}"
                     style="background:#4f46e5; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:bold; display:inline-block;">
                    Reset Password
                  </a>
                </div>

                <p style="color:#6b7280; font-size:14px; line-height:1.6;">
                  ⏳ <strong>Note:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons.
                </p>

                <!-- Info box -->
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:24px;">
                  <h3 style="margin-top:0; color:#111827;">Didn’t request this?</h3>
                  <p style="margin-bottom:0; color:#374151; font-size:14px;">
                    If you didn’t request a password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                  </p>
                </div>

                <!-- App link -->
                <p style="margin-top:32px; color:#374151;">
                  Or visit our app directly:
                </p>
                <p>
                  <a href="http://localhost:5173"
                     style="color:#4f46e5; text-decoration:none; font-weight:bold;">
                    Go to Application →
                  </a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px; background:#f3f4f6; text-align:center; font-size:13px; color:#6b7280;">
                <p style="margin:0;">
                  © 2026 Your App Name. All rights reserved.
                </p>
                <p style="margin:4px 0 0;">
                  Need help? Contact support anytime.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
    });
  }
}

import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

const FROM_EMAIL =
  process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@martinskarate.com";

export async function sendInstructorOtpEmail(
  to: string,
  otp: string,
  name: string
): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[dev] Instructor OTP for ${to}: ${otp}`);
      return;
    }
    throw new Error(
      "Email service is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS missing)"
    );
  }

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: "Verify your email — Martins Karate Academy",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
        <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a; margin: 0 0 8px;">Instructor Registration</p>
        <h1 style="font-size: 22px; font-weight: 500; margin: 0 0 16px;">Hi ${name},</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 24px;">
          Use this code to verify your email and complete your instructor application:
        </p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 600; letter-spacing: 0.35em; font-family: monospace; color: #09090b;">${otp}</span>
        </div>
        <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 0;">
          This code expires in 10 minutes. If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });
}

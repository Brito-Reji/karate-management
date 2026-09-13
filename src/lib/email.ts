import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Martins Karate <onboarding@resend.dev>";

export async function sendInstructorOtpEmail(
  to: string,
  otp: string,
  name: string
): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[dev] Instructor OTP for ${to}: ${otp}`);
      return;
    }
    throw new Error("Email service is not configured (RESEND_API_KEY missing)");
  }

  const { error } = await resend.emails.send({
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

  if (error) {
    throw new Error(error.message || "Failed to send verification email");
  }
}

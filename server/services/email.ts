import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "CodeVault <no-reply@codevault.dev>";

let resendClient: Resend | null = null;

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

interface SendOtpOptions {
  to: string;
  code: string;
  expiresAt: Date;
}

export async function sendOtpEmail({ to, code, expiresAt }: SendOtpOptions): Promise<boolean> {
  if (!resendClient) {
    console.info(`[Auth] OTP for ${to}: ${code} (expires at ${expiresAt.toISOString()})`);
    return false;
  }

  try {
    const expiresInMinutes = Math.ceil(
      Math.max(0, expiresAt.getTime() - Date.now()) / (60 * 1000)
    );

    await resendClient.emails.send({
      from: resendFrom,
      to,
      subject: "Your CodeVault verification code",
      html: `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; color: #0f172a;">
          <h1 style="margin: 0 0 16px; font-size: 24px; color: #5b21b6;">Your CodeVault login code</h1>
          <p style="margin: 0 0 12px;">Use the verification code below to finish signing in:</p>
          <div style="display: inline-block; padding: 12px 20px; background: #0f172a; color: #ffffff; border-radius: 12px; font-size: 24px; font-weight: 600; letter-spacing: 4px;">
            ${code}
          </div>
          <p style="margin: 16px 0 0; font-size: 14px; color: #475569;">
            This code expires in ${expiresInMinutes} minute${expiresInMinutes === 1 ? "" : "s"}.
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    console.info(`[Auth] OTP fallback for ${to}: ${code} (expires at ${expiresAt.toISOString()})`);
    return false;
  }
}


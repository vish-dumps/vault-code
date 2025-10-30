import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const smtpService = process.env.SMTP_SERVICE;
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
const smtpSecure =
  typeof process.env.SMTP_SECURE === "string"
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const resendFrom = process.env.RESEND_FROM || "CodeVault <no-reply@codevault.dev>";
const smtpFrom = process.env.SMTP_FROM || resendFrom;

let resendClient: Resend | null = null;
let smtpTransporter: nodemailer.Transporter | null = null;

if (smtpUser && smtpPass) {
  try {
    const transportOptions = smtpService
      ? {
          service: smtpService,
          auth: { user: smtpUser, pass: smtpPass },
        }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass },
        };

    smtpTransporter = nodemailer.createTransport(transportOptions);
    smtpTransporter.verify().catch((error: unknown) => {
      console.error("[Auth] SMTP transporter verification failed:", error);
      smtpTransporter = null;
    });
  } catch (error: unknown) {
    console.error("[Auth] Failed to configure SMTP transporter:", error);
    smtpTransporter = null;
  }
}

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

interface SendOtpOptions {
  to: string;
  code: string;
  expiresAt: Date;
}

export async function sendOtpEmail({ to, code, expiresAt }: SendOtpOptions): Promise<boolean> {
  const expiresInMinutes = Math.ceil(
    Math.max(0, expiresAt.getTime() - Date.now()) / (60 * 1000)
  );

  const subject = "Your CodeVault verification code";
  const html = `
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
  `;

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
      return true;
    } catch (error: unknown) {
      console.error("[Auth] Failed to send OTP email via SMTP:", error);
    }
  }

  if (resendClient) {
    try {
    await resendClient.emails.send({
      from: resendFrom,
      to,
      subject,
      html,
    });

    return true;
    } catch (error: unknown) {
      console.error("[Auth] Failed to send OTP email via Resend:", error);
    }
  }

  console.info(`[Auth] OTP fallback for ${to}: ${code} (expires at ${expiresAt.toISOString()})`);
  return false;
}

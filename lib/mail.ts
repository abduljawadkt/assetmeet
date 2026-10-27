import "server-only";
import nodemailer from "nodemailer";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

// Sends through your own mailbox (for example Hostinger email) using SMTP_* settings.
export async function sendMail(to: string, subject: string, text: string, html: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is not set, so sign-in emails cannot be sent.");
    // Local development without a mailbox: print the email instead of sending it.
    console.log(`\n[mail to ${to}] ${subject}\n${text}\n`);
    return;
  }
  const port = Number(process.env.SMTP_PORT || 465);
  transport ??= nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
}

import nodemailer, { Transporter } from "nodemailer";
import { formatMinorUnits, normalizeCurrencyCode } from "../utils/documentCurrency";

interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function readConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) return null;

  const port = portStr ? Number(portStr) : 587;
  return { host, port, user, pass, from };
}

let cachedTransporter: Transporter | null = null;
let cachedConfigKey: string | null = null;

function getTransporter(): Transporter | null {
  const cfg = readConfig();
  if (!cfg) return null;

  const key = `${cfg.host}|${cfg.port}|${cfg.user}`;
  if (cachedTransporter && cachedConfigKey === key) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });
  cachedConfigKey = key;
  return cachedTransporter;
}

function buildMessageId(to: string): string {
  const domain = readConfig()?.user.split("@")[1] || "localhost";
  return `<${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`;
}

function htmlWrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      <td align="center" style="padding:24px 0">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <tr>
            <td style="padding:20px 24px;background:#0f172a;color:#ffffff">
              <h1 style="margin:0;font-size:18px;font-weight:600">Church Financier</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;font-size:12px;color:#64748b">
              This message was sent from Church Financier. If you did not request this email, please contact your church administrator.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function textFallback(body: string): string {
  return `${body}\n\n— Church Financier`;
}

export const mailerService = {
  isConfigured(): boolean {
    return readConfig() !== null;
  },

  async send({ to, subject, text, html }: SendArgs): Promise<{ delivered: boolean; channel: "smtp" | "console"; error?: string }> {
    const cfg = readConfig();
    if (!cfg) {
      console.log(`\n[email:console] To: ${to}\n  Subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`);
      return { delivered: true, channel: "console" };
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.log(`\n[email:console] To: ${to}\n  Subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`);
      return { delivered: true, channel: "console" };
    }

    try {
      const messageId = buildMessageId(to);
      await transporter.sendMail({
        from: cfg.from,
        to,
        subject,
        text: textFallback(text),
        html: html ?? htmlWrap(subject, `<p>${text.replace(/\n/g, "</p><p>")}</p>`),
        headers: {
          "Message-ID": messageId,
          "Reply-To": cfg.from,
          "X-Mailer": "Church Financier",
          "X-Priority": "3",
        },
      });
      return { delivered: true, channel: "smtp" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[email:smtp:error] To=${to} Subject="${subject}" Error=${message}`);
      console.log(`\n[email:fallback:console] To: ${to}\n  Subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`);
      return { delivered: false, channel: "smtp", error: message };
    }
  },

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const body =
      `<p>Hello,</p>` +
      `<p>We received a request to reset the password for your Church Financier account.</p>` +
      `<p><a href="${link}" style="background:#0f172a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a></p>` +
      `<p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>` +
      `<p>— Church Financier</p>`;
    await this.send({
      to: email,
      subject: "Reset your Church Financier password",
      text:
        `Hello,\n\n` +
        `We received a request to reset the password for your Church Financier account.\n\n` +
        `Use the link below to set a new password. It will expire in 1 hour.\n\n` +
        `${link}\n\n` +
        `If you did not request this, you can safely ignore this email.\n\n` +
        `— Church Financier`,
      html: htmlWrap("Reset Password", body),
    });
  },

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const link = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const body =
      `<p>Welcome to <strong>Church Financier</strong>.</p>` +
      `<p>Please confirm your email address by clicking the button below. This link is valid for 24 hours.</p>` +
      `<p><a href="${link}" style="background:#0f172a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">Verify Email</a></p>` +
      `<p>Or copy this link: <br/><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">${link}</code></p>` +
      `<p>If you did not sign up, you can ignore this email.</p>`;
    await this.send({
      to: email,
      subject: "Verify your Church Financier email",
      text:
        `Welcome to Church Financier.\n\n` +
        `Please confirm your email by clicking the link below (valid 24 hours):\n\n` +
        `${link}\n\n` +
        `If you did not sign up, you can ignore this email.\n`,
      html: htmlWrap("Verify Email", body),
    });
  },

  async sendMfaCode(email: string, code: string): Promise<void> {
    const body =
      `<p>Your one-time login code is:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f1f5f9;padding:12px 20px;border-radius:6px;display:inline-block">${code}</p>` +
      `<p>This code expires in 10 minutes. If you did not try to sign in, please change your password immediately.</p>`;
    await this.send({
      to: email,
      subject: "Your Church Financier login code",
      text:
        `Your one-time login code is: ${code}\n\n` +
        `This code expires in 10 minutes. If you did not try to sign in, please change your password immediately.\n`,
      html: htmlWrap("Login Code", body),
    });
  },

  async sendReceipt(args: {
    email: string;
    donorName: string;
    amountInKobo: string | number;
    fundName: string;
    receiptNumber: string;
    date: Date;
    organizationName: string;
    currency?: string | null;
  }): Promise<void> {
    const code = normalizeCurrencyCode(args.currency);
    const amount = formatMinorUnits(args.amountInKobo, code);
    const dateStr = args.date.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

    const body =
      `<p>Dear <strong>${args.donorName}</strong>,</p>` +
      `<p>Thank you for your generous contribution to <strong>${args.organizationName}</strong>.</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px">` +
      `<tr><td style="padding:6px 0;color:#64748b">Receipt #</td><td style="padding:6px 0;text-align:right"><strong>${args.receiptNumber}</strong></td></tr>` +
      `<tr><td style="padding:6px 0;color:#64748b">Date</td><td style="padding:6px 0;text-align:right">${dateStr}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#64748b">Fund</td><td style="padding:6px 0;text-align:right">${args.fundName}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#64748b;border-top:1px solid #e5e7eb">Amount</td><td style="padding:6px 0;text-align:right;border-top:1px solid #e5e7eb"><strong style="font-size:18px">${amount}</strong></td></tr>` +
      `</table>` +
      `<p style="margin-top:20px">God bless you.</p>` +
      `<p style="color:#64748b;font-size:12px;margin-top:24px">— ${args.organizationName}</p>`;
    await this.send({
      to: args.email,
      subject: `Donation receipt — ${args.organizationName}`,
      text:
        `Dear ${args.donorName},\n\n` +
        `Thank you for your generous contribution to ${args.organizationName}.\n\n` +
        `Receipt #: ${args.receiptNumber}\n` +
        `Date: ${dateStr}\n` +
        `Fund: ${args.fundName}\n` +
        `Amount: ${amount}\n\n` +
        `God bless you.\n\n— ${args.organizationName}`,
      html: htmlWrap("Donation Receipt", body),
    });
  },
};
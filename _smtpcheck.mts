import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST!;
const port = Number(process.env.SMTP_PORT!);
const user = process.env.SMTP_USER!;
const pass = process.env.SMTP_PASS!;

console.log(`Testing ${user} @ ${host}:${port}`);

for (const [label, opts] of [
  ["family:4 (force IPv4)", { family: 4 }],
  ["default auto", {}],
] as const) {
  const t = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    ...(opts as any),
  } as any);
  try {
    const info = await t.verify();
    console.log(`${label}: AUTH OK ->`, info);
  } catch (e: any) {
    console.log(`${label}: FAIL ${e.message}`);
  }
}

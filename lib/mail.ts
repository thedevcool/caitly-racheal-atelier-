import "server-only";
import nodemailer from "nodemailer";
import type { Enquiry } from "@prisma/client";
import { db } from "./db";
import { escapeHtml } from "./escape";

/**
 * SMTP with Caitly's own email account and an app password (brief §7).
 * Provider-agnostic: only the env values change for a different provider.
 * Node.js runtime only; never imported by Edge code.
 */
export const mailConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD);

let transport: nodemailer.Transporter | null = null;
function transporter() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE ?? "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_APP_PASSWORD },
  });
  return transport;
}

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// ---- Template ---------------------------------------------------------------
const C = {
  bg: "#0B0B0C",
  card: "#151416",
  ink: "#EDE6DA",
  muted: "#B3AA9C",
  gold: "#D4B47A",
  line: "#2A2724",
};

function shell(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border:1px solid ${C.line};border-radius:16px;">
<tr><td style="padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};font-size:22px;">
Caitly Racheal <span style="color:${C.gold};font-size:14px;">아틀리에</span></td></tr>
${body}
<tr><td style="padding:20px 32px 28px;font-family:Arial,sans-serif;font-size:12px;color:${C.muted};border-top:1px solid ${C.line};">
아름다움은 팔린다 · beauty sells</td></tr>
</table></td></tr></table></body></html>`;
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 32px;font-family:Arial,sans-serif;font-size:14px;color:${C.ink};">
<div style="color:${C.muted};font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px;">${escapeHtml(label)}</div>
${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;

export function enquiryEmail(e: Enquiry, roomName: string) {
  const subject = `New commission enquiry · ${roomName} · ${e.name}`;
  const link = `${siteUrl()}/admin/enquiries/${e.id}`;
  const html = shell(
    subject,
    `<tr><td style="padding:8px 32px 16px;font-family:Georgia,serif;font-size:30px;line-height:1.15;color:${C.ink};">
A new brief for <em style="color:${C.gold};">${escapeHtml(roomName)}</em></td></tr>
${row("Name", e.name)}${row("Email", e.email)}${row("Room", roomName)}${e.budget ? row("Budget", e.budget) : ""}${row("Brief", e.message)}
<tr><td style="padding:20px 32px 28px;">
<a href="${escapeHtml(link)}" style="display:inline-block;background:${C.gold};color:#0B0B0C;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:14px 26px;border-radius:999px;">Open in your atelier</a>
<p style="font-family:Arial,sans-serif;font-size:13px;color:${C.muted};margin:16px 0 0;">Press Reply to answer ${escapeHtml(e.name)} directly.</p>
</td></tr>`,
  );
  const text = [
    subject,
    "",
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    `Room: ${roomName}`,
    e.budget ? `Budget: ${e.budget}` : null,
    "",
    "Brief:",
    e.message,
    "",
    `Open in your atelier: ${link}`,
    `Press Reply to answer ${e.name} directly.`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return { subject, html, text };
}

function confirmationEmail(e: Enquiry, roomName: string) {
  const subject = "감사합니다 · Your brief reached Caitly Racheal Atelier";
  const html = shell(
    subject,
    `<tr><td style="padding:8px 32px 8px;font-family:Georgia,serif;font-size:30px;line-height:1.15;color:${C.ink};">감사합니다, ${escapeHtml(e.name)}.</td></tr>
<tr><td style="padding:6px 32px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">
Your brief for <span style="color:${C.gold};">${escapeHtml(roomName)}</span> has arrived. I reply within two working days with ideas and next steps.<br><br>
<span style="color:${C.muted};">Caitly</span></td></tr>`,
  );
  const text = `감사합니다, ${e.name}.\n\nYour brief for ${roomName} has arrived. I reply within two working days with ideas and next steps.\n\nCaitly`;
  return { subject, html, text };
}

// ---- Sending ------------------------------------------------------------------

/**
 * Sends the notification for a saved enquiry and records emailSent. Never
 * throws: failures are logged and the enquiry stays safe in the admin inbox.
 */
export async function sendEnquiryNotification(enquiry: Enquiry): Promise<boolean> {
  if (!mailConfigured()) {
    console.warn("[atelier] SMTP is not configured; enquiry saved without email:", enquiry.id);
    return false;
  }
  try {
    const [settings, room] = await Promise.all([
      db.siteSettings.findUnique({ where: { id: 1 } }),
      db.room.findUnique({ where: { slug: enquiry.room } }),
    ]);
    const roomName = room?.name ?? enquiry.room;
    const { subject, html, text } = enquiryEmail(enquiry, roomName);
    await transporter().sendMail({
      // Personal mail providers reject other "from" addresses, so it is always her own
      from: { name: "Caitly Racheal Atelier", address: process.env.SMTP_USER! },
      to: settings?.notifyEmail || process.env.SMTP_USER,
      replyTo: { name: enquiry.name, address: enquiry.email },
      subject,
      html,
      text,
    });
    await db.enquiry.update({ where: { id: enquiry.id }, data: { emailSent: true } });

    if (settings?.confirmVisitor) {
      const c = confirmationEmail(enquiry, roomName);
      await transporter()
        .sendMail({
          from: { name: "Caitly Racheal Atelier", address: process.env.SMTP_USER! },
          to: enquiry.email,
          replyTo: settings.displayEmail || process.env.SMTP_USER,
          ...c,
        })
        .catch((e) => console.error("[atelier] visitor confirmation failed", e));
    }
    return true;
  } catch (e) {
    console.error("[atelier] enquiry notification failed", enquiry.id, e);
    return false;
  }
}

/** Settings → "Send test email". Returns a friendly message, never the raw SMTP error. */
export async function sendTestEmail(to: string): Promise<{ ok: boolean; message: string }> {
  if (!mailConfigured()) {
    return {
      ok: false,
      message: "Email isn’t set up yet: add SMTP_HOST, SMTP_USER and SMTP_APP_PASSWORD on Vercel.",
    };
  }
  try {
    await transporter().verify();
    await transporter().sendMail({
      from: { name: "Caitly Racheal Atelier", address: process.env.SMTP_USER! },
      to,
      subject: "Test email from your atelier ✓",
      text: "Your website can send email. Enquiries will arrive in this inbox.",
      html: shell(
        "Test email",
        `<tr><td style="padding:8px 32px 28px;font-family:Arial,sans-serif;font-size:15px;color:${C.ink};">Your website can send email. Enquiries will arrive in this inbox. ✓</td></tr>`,
      ),
    });
    return { ok: true, message: `Sent. Check ${to}.` };
  } catch (e) {
    console.error("[atelier] test email failed", e);
    const auth = /auth|535|534|credentials/i.test(String(e));
    return {
      ok: false,
      message: auth
        ? "Your email provider refused the login. Check SMTP_USER and the app password (not your normal password)."
        : "Couldn’t reach the email server. Check SMTP_HOST, SMTP_PORT and SMTP_SECURE.",
    };
  }
}

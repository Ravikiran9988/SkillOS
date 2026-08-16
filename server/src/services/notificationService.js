/**
 * Notification Service — Production Zoho SMTP Email Delivery & OTP Templates
 * Supports: smtp (Zoho/standard), console (dev fallback), resend, sendgrid.
 */

const nodemailer = require('nodemailer');

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || (process.env.SMTP_HOST ? 'smtp' : 'console');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Get configured email sender address
 */
function getSenderAddress() {
  return (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    `KiranVerse <${process.env.SMTP_USER || 'admin@kiranverse.tech'}>`
  );
}

/**
 * Create or reuse the Nodemailer SMTP transporter
 */
let cachedTransporter = null;

function getSmtpTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || 'smtppro.zoho.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || 'admin@kiranverse.tech';
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!pass && process.env.NODE_ENV === 'production') {
    console.warn('[NOTIFICATION] SMTP_PASSWORD is not configured in production environment.');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587 (STARTTLS)
    auth: {
      user,
      pass: pass || '',
    },
    // Safe timeout settings
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return cachedTransporter;
}

/**
 * Base email dispatcher
 */
async function sendEmail({ to, subject, html, text }) {
  const from = getSenderAddress();

  switch (EMAIL_PROVIDER) {
    case 'smtp': {
      const transporter = getSmtpTransporter();
      try {
        const info = await transporter.sendMail({
          from,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        });
        console.log(`[EMAIL/SMTP] Message delivered to ${to} (id: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EMAIL/SMTP] Delivery failed to ${to}: ${err.message}`);
        throw err;
      }
    }

    case 'resend': {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.EMAIL_API_KEY);
      await resend.emails.send({ from, to, subject, html });
      return { success: true };
    }

    case 'sendgrid': {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.EMAIL_API_KEY);
      await sgMail.send({ to, from, subject, html, text });
      return { success: true };
    }

    case 'console':
    default: {
      console.log('\n[EMAIL/DEV-CONSOLE] ────────────────────────────────────');
      console.log(`From: ${from}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text || html}`);
      console.log('────────────────────────────────────────────────────────\n');
      return { success: true };
    }
  }
}

/**
 * Send 6-Digit OTP Verification Email
 *
 * @param {string} email - Destination address
 * @param {string} otp - 6-digit verification code
 * @param {string} [purpose='authentication'] - Purpose (login, register, reset, verify)
 */
async function sendOtpEmail(email, otp, purpose = 'authentication') {
  const purposeMap = {
    login: 'Log in to your account',
    register: 'Complete your registration',
    'reset-password': 'Reset your password',
    verify: 'Verify your email address',
    authentication: 'Sign in / Verify',
  };

  const actionText = purposeMap[purpose] || 'Verify your action';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SkillOS Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%);border-bottom:1px solid #334155;">
              <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Skill<span style="color:#60a5fa;">OS</span></h1>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;font-weight:500;">AI Career Intelligence Platform • KiranVerse</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#f8fafc;">${actionText}</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#cbd5e1;">
                Use the following 6-digit verification code to proceed. This code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="background:#0f172a;border:2px dashed #3b82f6;border-radius:12px;padding:20px;">
                    <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#60a5fa;font-family:Courier,monospace;">${otp}</span>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;border-radius:6px;padding:12px 16px;margin:0 0 24px;">
                <tr>
                  <td style="font-size:12px;color:#fca5a5;line-height:1.5;">
                    <strong>Security Notice:</strong> Never share this OTP with anyone. SkillOS and KiranVerse support will never ask for your verification code.
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                If you did not request this verification code, please ignore this email or update your password if you suspect unauthorized activity.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#0f172a;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                Sent securely by <strong>KiranVerse</strong> via Zoho SMTP • <a href="https://skillos.app" style="color:#60a5fa;text-decoration:none;">skillos.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `SkillOS Verification Code: ${otp}\n\nUse this 6-digit code to ${actionText.toLowerCase()}.\nThis code expires in 10 minutes.\n\nSecurity Notice: Never share this OTP with anyone.\n\nSent by KiranVerse (admin@kiranverse.tech)`;

  return sendEmail({
    to: email,
    subject: `Your SkillOS Verification Code: ${otp}`,
    html,
    text,
  });
}

/**
 * Send Magic Link Email Verification
 */
async function sendVerificationEmail(email, name, token) {
  const url = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your SkillOS email',
    html: `
      <h2>Welcome to SkillOS, ${name}!</h2>
      <p>Please verify your email address to complete your registration.</p>
      <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
    text: `Welcome to SkillOS! Verify your email: ${url}`,
  });
}

/**
 * Send Magic Link Password Reset
 */
async function sendPasswordResetEmail(email, name, token) {
  const url = `${FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your SkillOS password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, we received a request to reset your SkillOS password.</p>
      <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `,
    text: `Reset your SkillOS password: ${url}`,
  });
}

async function createInAppNotification(neo4jSession, { studentId, type, title, message, link }) {
  console.log(`[NOTIFICATION] ${type} → ${studentId}: ${title}`);
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  createInAppNotification,
  getSenderAddress,
  getSmtpTransporter,
};

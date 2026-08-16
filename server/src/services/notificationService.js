/**
 * Notification Service — abstraction over email and in-app notifications.
 * Supports: console (dev), resend, sendgrid, smtp providers.
 */

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@skillos.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Email Provider ───────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html, text }) {
  switch (EMAIL_PROVIDER) {
    case 'console':
      console.log('\n[EMAIL] ────────────────────────────────────');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text || html}`);
      console.log('────────────────────────────────────────────\n');
      return;

    case 'resend': {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.EMAIL_API_KEY);
      await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
      return;
    }

    case 'sendgrid': {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.EMAIL_API_KEY);
      await sgMail.send({ to, from: EMAIL_FROM, subject, html, text });
      return;
    }

    case 'smtp': {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from: EMAIL_FROM, to, subject, html, text });
      return;
    }

    default:
      console.warn(`[NOTIFICATION] Unknown email provider: ${EMAIL_PROVIDER}`);
  }
}

// ─── Public Methods ───────────────────────────────────────────────────────────

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
  // For now, log — full Neo4j integration wired in notificationRepository
  console.log(`[NOTIFICATION] ${type} → ${studentId}: ${title}`);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, createInAppNotification, sendEmail };

const nodemailer = require('nodemailer');

/**
 * Email utility using Brevo SMTP (recommended for cloud/Render deployment).
 *
 * Required environment variables on Render:
 *   BREVO_SMTP_USER  — your Brevo SMTP login (e.g. a57ee4001@smtp-brevo.com)
 *   BREVO_SMTP_PASS  — your Brevo generated SMTP key
 *   EMAIL_FROM       — verified sender email (e.g. himanshu7046m@gmail.com)
 *
 * Local dev fallback: uses SMTP_USER / SMTP_PASS with Gmail App Password.
 */

const createTransporter = () => {
  const host = 'smtp-relay.brevo.com';
  const port = 587;
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('❌ SMTP credentials missing! Set BREVO_SMTP_USER and BREVO_SMTP_PASS on Render.');
  } else {
    console.log(`📧 SMTP transport ready: ${host}:${port} | user=${user}`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // STARTTLS
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Sends an email.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
  const from = `RentMate <${fromEmail}>`;

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`✅ Email sent to ${to} | MessageId: ${info.messageId} | Response: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Generates an HTML email template for OTP verification.
 */
const otpEmailHtml = (otp, name = 'Student') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 28px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .body { padding: 32px 40px; }
    .greeting { color: #475569; font-size: 15px; margin-bottom: 24px; }
    .otp-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
    .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; }
    .note { color: #94a3b8; font-size: 13px; text-align: center; margin-top: 8px; }
    .warning { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 12px 16px; color: #9a3412; font-size: 13px; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 RentMate</h1>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong>${name}</strong>, verify your email to finish creating your RentMate account.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p class="note">Valid for <strong>5 minutes</strong> only</p>
      </div>
      <div class="warning">⚠️ Never share this OTP. RentMate will never ask for it.</div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} RentMate · Campus Item Rental Platform</div>
  </div>
</body>
</html>
`;

module.exports = { sendEmail, otpEmailHtml };

const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer.
 * Supports Brevo, Gmail, or any SMTP provider via environment variables.
 * 
 * Brevo (recommended for cloud servers - free 300 emails/day):
 *   SMTP_HOST=smtp-relay.brevo.com
 *   SMTP_PORT=587
 *   SMTP_USER=<your brevo login email>
 *   SMTP_PASS=<your brevo SMTP key>
 *   FROM_EMAIL=<your verified sender email on Brevo>
 */

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  console.log(`📧 Creating SMTP transport: ${host}:${port} user=${process.env.SMTP_USER}`);
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Sends an email.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const from = `RentMate <${process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@rentmate.app'}>`;

  // ── Use Resend API if key is present (recommended for cloud hosting) ──────
  if (process.env.RESEND_API_KEY) {
    const https = require('https');
    const body = JSON.stringify({ from: process.env.FROM_EMAIL || 'RentMate <onboarding@resend.dev>', to, subject, html });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Resend email sent to ${to}: ${parsed.id}`);
            resolve(parsed);
          } else {
            console.error(`❌ Resend failed:`, parsed);
            reject(new Error(parsed.message || 'Resend API error'));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // ── Fall back to Nodemailer SMTP (works locally) ──────────────────────────
  const transporter = createTransporter();
  const mailOptions = { from, to, subject, html };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Generates an HTML email template for OTP
 */
const otpEmailHtml = (otp, name = 'Student') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #fff; padding: 24px 40px; text-align: center; border-bottom: 3px solid #6366f1; }
    .header img { max-height: 80px; width: auto; }
    .body { padding: 32px 40px; }
    .greeting { color: #475569; font-size: 15px; margin-bottom: 24px; }
    .otp-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
    .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; }
    .note { color: #94a3b8; font-size: 13px; text-align: center; margin-top: 8px; }
    .warning { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 12px 16px; color: #9a3412; font-size: 13px; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="cid:rentmatelogo" alt="RentMate Logo" />
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

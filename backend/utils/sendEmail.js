const https = require('https');

/**
 * Email utility using Brevo HTTP API v3 (NOT SMTP).
 *
 * WHY HTTP API: Cloud hosting providers (Render free tier) block outbound SMTP
 * port 587. HTTP API uses port 443 which is always open.
 *
 * Required environment variables on Render:
 *   BREVO_API_KEY  — your Brevo API key (from Brevo → SMTP & API → API Keys tab)
 *   EMAIL_FROM     — verified sender email (e.g. himanshu7046m@gmail.com)
 *
 * Get your API key at: https://app.brevo.com → SMTP & API → API Keys & MCP
 */

/**
 * Sends an email via Brevo HTTP API v3.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;

  if (!apiKey) {
    console.error('❌ BREVO_API_KEY is not set in environment variables!');
    throw new Error('BREVO_API_KEY missing. Set it in Render environment variables.');
  }

  if (!fromEmail) {
    console.error('❌ EMAIL_FROM is not set in environment variables!');
    throw new Error('EMAIL_FROM missing. Set it in Render environment variables.');
  }

  const payload = JSON.stringify({
    sender: { name: 'RentMate', email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  console.log(`📧 Sending email via Brevo API to: ${to}`);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            console.log(`✅ Email sent to ${to} | Brevo messageId: ${parsed.messageId}`);
            resolve(parsed);
          } else {
            console.error(`❌ Brevo API error ${res.statusCode}:`, data);
            reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', (err) => {
      console.error('❌ Brevo HTTP request error:', err.message);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
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
    <div class="header"><h1>🎓 RentMate</h1></div>
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

const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Bulletproof Email Utility
 * Will systematically try different delivery methods to ensure the OTP reaches the user.
 */
const sendEmail = async ({ to, subject, html }) => {
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoPass = process.env.BREVO_SMTP_PASS; // API Key
  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@rentmate.com';

  const mailOptions = {
    from: `"RentMate" <${fromEmail}>`,
    to,
    subject: subject || 'Your RentMate OTP',
    html,
  };

  // Method 1: Brevo SMTP (Port 2525 bypasses Render 587 block)
  const tryBrevoSmtp = async () => {
    console.log('--- 1/3: Attempting Brevo SMTP (Port 2525) ---');
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 2525, 
      secure: false, 
      auth: { user: brevoUser, pass: brevoPass },
      tls: { rejectUnauthorized: false }
    });
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via Brevo SMTP:', info.response);
    return info;
  };

  // Method 2: Brevo HTTP API (Port 443 is NEVER blocked by Render)
  const tryBrevoHttpApi = () => {
    return new Promise((resolve, reject) => {
      console.log('--- 2/3: Attempting to send via Brevo HTTP API (Port 443) ---');
      const payload = JSON.stringify({
        sender: { email: fromEmail, name: "RentMate" },
        to: [{ email: to }],
        subject: mailOptions.subject,
        htmlContent: html,
      });

      const req = https.request(
        {
          hostname: 'api.brevo.com',
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'api-key': brevoPass, 
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('✅ Email sent via Brevo HTTP API!');
              resolve(JSON.parse(data));
            } else {
              console.error('❌ Brevo HTTP API Error:', res.statusCode, data);
              reject(new Error(`Brevo API Error: ${data}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  };

  // Method 3: Gmail Backup from standard .env
  const tryGmailSmtp = async () => {
    console.log('--- 3/3: Attempting Gmail SMTP Fallback ---');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false }
    });
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via Gmail:', info.response);
    return info;
  };

  // EXECUTION FLOW
  if (brevoUser && brevoPass) {
    try {
      return await tryBrevoSmtp();
    } catch (err1) {
      console.error('❌ Brevo SMTP failed:', err1.message);
      try {
        console.log('⚠️ Trying Brevo HTTP API instead...');
        return await tryBrevoHttpApi();
      } catch (err2) {
        console.error('❌ Brevo HTTP API failed:', err2.message);
        console.log('⚠️ Brevo failed completely. Using Gmail Fallback...');
        return await tryGmailSmtp();
      }
    }
  } else {
    // If no Brevo keys, try Gmail natively
    return await tryGmailSmtp();
  }
};

const otpEmailHtml = (otp) => `Your OTP is ${otp}. It is valid for 5 minutes.`;

module.exports = { sendEmail, otpEmailHtml };

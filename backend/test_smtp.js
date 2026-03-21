require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection FAILED:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ SMTP connection works! Sending test email...');
    transporter.sendMail({
      from: `RentMate <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'RentMate SMTP Test',
      text: 'If you see this, email is working!',
    }, (err, info) => {
      if (err) console.error('❌ Send failed:', err.message);
      else console.log('✅ Email sent! MessageId:', info.messageId);
    });
  }
});

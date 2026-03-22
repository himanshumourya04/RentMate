require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function test() {
  try {
    const to = process.env.SMTP_USER;
    if (!to) {
      console.log('No SMTP_USER found in .env, skipping test');
      return;
    }
    console.log('Testing sendEmail to:', to);
    const result = await sendEmail({
      to,
      subject: 'Test Email from modified sendEmail.js',
      html: '<p>This is a test of the fallback mechanism in RentMate.</p>'
    });
    console.log('Test successful. Result ID:', result.messageId || result);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();

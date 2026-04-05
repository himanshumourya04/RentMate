const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { register, login, managementLogin, getMe, sendEmailOtp, verifyEmailOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const { storage } = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Images only'));
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const uploadFields = upload.fields([
  { name: 'collegeIdImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 },
]);

router.post('/register', uploadFields, register);
router.post('/login', login);
router.post('/management-login', managementLogin);
router.get('/me', protect, getMe);

// OTP routes (public — no auth needed)
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);

// ── Test email route — GET /api/auth/test-email?to=your@email.com ────────────
router.get('/test-email', async (req, res) => {
  const { sendEmail } = require('../utils/sendEmail');
  const to = req.query.to || process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!to) return res.status(400).json({ message: 'Provide ?to=email query param' });
  try {
    await sendEmail({
      to,
      subject: 'RentMate SMTP Test ✅',
      html: `<h2>🎓 RentMate</h2><p>If you see this, your Brevo SMTP is working correctly on Render!</p><p>Time: ${new Date().toISOString()}</p>`,
    });
    res.json({ message: `✅ Test email sent to ${to}` });
  } catch (err) {
    console.error('Test email failed:', err.message);
    res.status(500).json({ message: `❌ Email failed: ${err.message}` });
  }
});

module.exports = router;

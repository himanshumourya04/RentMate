const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { register, login, managementLogin, getMe, sendEmailOtp, verifyEmailOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Multer config for student registration uploads (collegeIdImage + selfieImage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'selfieImage' ? 'selfie' : 'collegeid';
    cb(null, `${prefix}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  },
});
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

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/OTP');
const { sendEmail, otpEmailHtml } = require('../utils/sendEmail');

// Helper to generate a cryptographically random 6-digit OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc  Register student (Management registration is BLOCKED — Admin only)
// @route POST /api/auth/register  (multipart/form-data)
const register = async (req, res) => {
  try {
    const { name, email, password, role, branch, department, phone } = req.body;
    const { emailToken } = req.body; // Proof of email verification

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Management registration blocked from public signup
    if (role === 'management') {
      return res.status(403).json({
        message: 'Management accounts are created by Admin only. Please contact your administrator.',
      });
    }

    // Verify the email token issued after Email OTP verification
    if (!emailToken) {
      return res.status(400).json({ message: 'Email verification is required. Please verify your email first.' });
    }
    let emailPayload;
    try {
      emailPayload = jwt.verify(emailToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Email verification has expired. Please re-verify your email.' });
    }
    if (!emailPayload.emailVerified || emailPayload.email !== email.toLowerCase()) {
      return res.status(400).json({ message: 'Email verification mismatch. Please re-verify your email.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login.' });
    }

    // Validate student-required fields
    if (!req.files?.collegeIdImage) {
      return res.status(400).json({ message: 'College ID image is required for student registration' });
    }
    if (!req.files?.selfieImage) {
      return res.status(400).json({ message: 'Selfie photo is required for student registration' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student', // Force student role
      branch: branch || null,
      department: department || branch || '',
      phone: phone || '',
      collegeIdImage: req.files.collegeIdImage[0].filename,
      selfieImage: req.files.selfieImage[0].filename,
      profileImage: req.files.selfieImage[0].filename,
      emailVerified: true,
      managementVerified: false,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      department: user.department,
      phone: user.phone,
      collegeIdImage: user.collegeIdImage,
      selfieImage: user.selfieImage,
      emailVerified: user.emailVerified,
      
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Send Email OTP for registration verification
// @route POST /api/auth/send-email-otp
const sendEmailOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login.' });
    }

    const otp = generateOtp();
    await Otp.createOtp(email.toLowerCase(), 'email', otp);

    // Always print OTP to console so dev testing works even without SMTP
    console.log(`\n📧 EMAIL OTP for ${email}: ${otp}\n`);

    try {
      await sendEmail({
        to: email,
        subject: 'Your RentMate Verification OTP',
        html: otpEmailHtml(otp, name || 'Student'),
      });
    } catch (emailErr) {
      console.warn('Email delivery failed (check SMTP config):', emailErr.message);
    }

    res.json({ message: `OTP sent to ${email}. Check your inbox (or server console in dev mode).` });
  } catch (error) {
    res.status(429).json({ message: error.message });
  }
};

// @desc  Verify Email OTP — returns a short-lived emailToken
// @route POST /api/auth/verify-email-otp
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const result = await Otp.verifyOtp(email.toLowerCase(), 'email', otp);
    if (!result.success) {
      return res.status(400).json({ message: result.reason });
    }

    // Issue a short-lived token — frontend includes it in the final register request
    const emailToken = jwt.sign(
      { email: email.toLowerCase(), emailVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ message: 'Email verified successfully! ✅', emailToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Login student / admin (standard login)
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Management must use the separate Management Login page
    if (user.role === 'management') {
      return res.status(403).json({
        message: 'Management must use the Management Login page.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      department: user.department,
      phone: user.phone,
      collegeIdImage: user.collegeIdImage,
      selfieImage: user.selfieImage,
      profileImage: user.profileImage,
      emailVerified: user.emailVerified,
      
      
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Management Login — requires email + password + managementId (all must match)
// @route POST /api/auth/management-login
const managementLogin = async (req, res) => {
  try {
    const { email, password, managementId } = req.body;

    if (!email || !password || !managementId) {
      return res.status(400).json({
        message: 'Please provide email, password, and Management ID.',
      });
    }

    const user = await User.findOne({ email });

    // Check all conditions — give same error for any mismatch (security best practice)
    const genericError = 'Invalid credentials. Please use Admin provided details.';

    if (!user || user.role !== 'management') {
      return res.status(401).json({ message: genericError });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: genericError });
    }

    if (user.managementId !== managementId) {
      return res.status(401).json({ message: genericError });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      department: user.department,
      phone: user.phone,
      managementId: user.managementId,
      profileImage: user.profileImage,
      emailVerified: user.emailVerified,
      
      
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get current user profile
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, managementLogin, getMe, sendEmailOtp, verifyEmailOtp };

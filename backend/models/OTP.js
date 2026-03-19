const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  // Email or phone number that the OTP is for
  key: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  // Type of OTP — email or phone
  type: {
    type: String,
    enum: ['email', 'phone'],
    required: true,
  },
  // Hashed OTP (plain text OTP is never stored)
  otpHash: {
    type: String,
    required: true,
  },
  // Number of verify attempts (to prevent brute force)
  attempts: {
    type: Number,
    default: 0,
  },
  // Number of send requests in the past window
  sendCount: {
    type: Number,
    default: 1,
  },
  // Auto-deletes document after expiry (MongoDB TTL)
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 min
  },
}, { timestamps: true });

// TTL index — MongoDB will automatically remove documents once expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Index for fast lookups by key+type
otpSchema.index({ key: 1, type: 1 });

// Helper: Create/refresh OTP (hashed)
otpSchema.statics.createOtp = async function (key, type, plain) {
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(plain, salt);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Upsert: update existing record for same key+type
  const existing = await this.findOne({ key, type });
  if (existing) {
    if (existing.sendCount >= 3) {
      throw new Error('Maximum OTP requests reached. Please wait and try again later.');
    }
    existing.otpHash = otpHash;
    existing.attempts = 0;
    existing.sendCount += 1;
    existing.expiresAt = expiresAt;
    return existing.save();
  }

  return this.create({ key, type, otpHash, expiresAt });
};

// Helper: Verify an OTP
otpSchema.statics.verifyOtp = async function (key, type, plain) {
  const record = await this.findOne({ key, type });
  if (!record) return { success: false, reason: 'OTP not found or has expired. Please request a new one.' };

  // Max 5 wrong attempts before invalidating
  if (record.attempts >= 5) {
    await record.deleteOne();
    return { success: false, reason: 'Too many attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(String(plain), record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return { success: false, reason: `Incorrect OTP. ${5 - record.attempts} attempts remaining.` };
  }

  // OTP correct — remove it so it can't be reused
  await record.deleteOne();
  return { success: true };
};

module.exports = mongoose.model('Otp', otpSchema);

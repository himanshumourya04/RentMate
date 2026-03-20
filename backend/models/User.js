const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'management', 'admin'],
    default: 'student',
  },
  branch: {
    type: String,
    enum: ['CSE', 'Mechanical', 'Electrical', 'Civil', 'IT'],
    default: null,
  },  phone: {
    type: String,
    trim: true,
  },
  // Management-specific
  managementId: {
    type: String,
    default: null,
  },
  // Profile image (editable by all roles)
  profileImage: {
    type: String,
    default: null,
  },
  // Student identity verification fields
  collegeIdImage: {
    type: String,
    default: null,
  },
  selfieImage: {
    type: String,
    default: null,
  },
    emailVerified: {
    type: Boolean,
    default: false,
  },
  managementVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const userDoc = await this.model.findOne(this.getQuery());
    if (userDoc) {
      const Item = require('./Item');
      const Booking = require('./Booking');
      const ItemRequest = require('./ItemRequest');
      const Message = require('./Message');
      const Otp = require('./OTP'); // Fixed case sensitivity

      // 1. Cascade items linearly to safely trigger Item's own pre-hooks
      const items = await Item.find({ ownerId: userDoc._id });
      for (const item of items) {
        await Item.findOneAndDelete({ _id: item._id });
      }

      // 2. Destroy references where user acts as borrower or requester
      await Booking.deleteMany({ borrowerId: userDoc._id });
      await ItemRequest.deleteMany({ userId: userDoc._id });

      // 3. Destroy chat logs
      await Message.deleteMany({
        $or: [{ senderId: userDoc._id }, { receiverId: userDoc._id }]
      });

      // 4. Destroy active verification Otps
      await Otp.deleteMany({ email: userDoc.email });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);

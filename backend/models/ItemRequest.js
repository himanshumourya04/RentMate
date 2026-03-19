const mongoose = require('mongoose');

const itemRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // nullable for admin banners
  },
  itemName: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  branch: {
    type: String,
  },
  type: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  duration: {
    type: String,
    default: '1 week',
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

// Auto-expire requests that are past their expiresAt date (TTL Index)
itemRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ItemRequest', itemRequestSchema);

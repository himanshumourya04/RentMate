const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Books', 'Electronics', 'Gadgets', 'Transport', 'Clothing', 'Project Tools', 'Hostel Essentials', 'Other'],
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  availability: {
    type: Boolean,
    default: true,
  },
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor'],
    default: 'Good',
  },
}, { timestamps: true });

itemSchema.pre('findOneAndDelete', async function(next) {
  try {
    const itemDoc = await this.model.findOne(this.getQuery());
    if (itemDoc) {
      const Booking = require('./Booking');
      const ItemRequest = require('./ItemRequest');
      await Booking.deleteMany({ itemId: itemDoc._id });
      await ItemRequest.deleteMany({ itemId: itemDoc._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Item', itemSchema);

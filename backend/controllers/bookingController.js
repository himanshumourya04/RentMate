const Booking = require('../models/Booking');
const Item = require('../models/Item');
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');

// @desc  Request a booking (creates booking + verification request assigned to branch management)
// @route POST /api/bookings/request
const requestBooking = async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.body;
    if (!itemId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide itemId, startDate, and endDate' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.availability) return res.status(400).json({ message: 'Item is not available for rent' });
    if (item.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot rent your own item' });
    }

    // Get the student's branch
    const studentBranch = req.user.branch;
    if (!studentBranch) {
      return res.status(400).json({ message: 'Your profile does not have a branch assigned. Please update your profile.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 0) return res.status(400).json({ message: 'End date must be after start date' });

    const totalPrice = days * item.pricePerDay;

    // Create the booking with branch
    const booking = await Booking.create({
      itemId,
      borrowerId: req.user._id,
      ownerId: item.ownerId,
      branch: studentBranch,
      startDate: start,
      endDate: end,
      totalPrice,
    });

    // Create verification request assigned to the branch
    await VerificationRequest.create({
      borrowerId: req.user._id,
      branch: studentBranch,
      itemId,
      bookingId: booking._id,
    });

    res.status(201).json({
      booking,
      message: `Booking request submitted. Your request has been sent to the ${studentBranch} management for verification.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get bookings for borrower
// @route GET /api/bookings/student
const getStudentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ borrowerId: req.user._id })
      .populate('itemId', 'itemName image category pricePerDay')
      .populate('ownerId', 'name email')
      .populate('managementId', 'name email branch')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get bookings for item owner
// @route GET /api/bookings/owner
const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user._id })
      .populate('itemId', 'itemName image category')
      .populate('borrowerId', 'name email department branch phone')
      .populate('managementId', 'name email branch')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update booking status (owner)
// @route PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    booking.bookingStatus = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Finalize rental after management approval (borrower)
// @route PUT /api/bookings/:id/finalize
const finalizeRental = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.borrowerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.managementVerificationStatus !== 'Approved') {
      return res.status(400).json({ message: 'Management approval is required before finalizing rental' });
    }

    if (booking.bookingStatus !== 'Pending') {
      return res.status(400).json({ message: 'Booking is already processed or active' });
    }

    booking.bookingStatus = 'Awaiting Payment';
    await booking.save();

    res.json({ message: 'Rental request finalized! Waiting for owner to confirm payment.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Accept payment (lender)
// @route PUT /api/bookings/:id/accept-payment
const acceptPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.bookingStatus !== 'Awaiting Payment') {
      return res.status(400).json({ message: 'Booking is not in Awaiting Payment status' });
    }

    booking.bookingStatus = 'Active';
    await booking.save();

    await Item.findByIdAndUpdate(booking.itemId, { availability: false });

    res.json({ message: 'Payment accepted! Rental is now active.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestBooking, getStudentBookings, getOwnerBookings, updateBookingStatus, finalizeRental, acceptPayment };

const express = require('express');
const router = express.Router();
const {
  requestBooking,
  getStudentBookings,
  getOwnerBookings,
  updateBookingStatus,
  finalizeRental,
  acceptPayment,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, requestBooking);
router.get('/student', protect, getStudentBookings);
router.get('/owner', protect, getOwnerBookings);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/finalize', protect, finalizeRental);
router.put('/:id/accept-payment', protect, acceptPayment);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getManagementForBooking,
} = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/pending', protect, authorize('management', 'admin'), getPendingRequests);
router.get('/all', protect, authorize('management', 'admin'), getAllRequests);
router.get('/management/:bookingId', protect, getManagementForBooking);
router.put('/approve/:id', protect, authorize('management', 'admin'), approveRequest);
router.put('/reject/:id', protect, authorize('management', 'admin'), rejectRequest);

module.exports = router;

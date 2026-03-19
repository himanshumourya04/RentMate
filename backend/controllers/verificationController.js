const VerificationRequest = require('../models/VerificationRequest');
const Booking = require('../models/Booking');

// @desc  Get pending verification requests (branch-filtered for management)
// @route GET /api/verification/pending
const getPendingRequests = async (req, res) => {
  try {
    // Management only sees requests matching their branch
    const filter = { status: 'Pending', branch: req.user.branch };

    const requests = await VerificationRequest.find(filter)
      .populate('borrowerId', 'name email branch phone collegeIdImage selfieImage profileImage managementVerified')
      .populate({ path: 'itemId', select: 'itemName description category pricePerDay image', populate: { path: 'ownerId', select: 'name email branch phone collegeIdImage selfieImage profileImage' } })
      .populate('bookingId', 'startDate endDate totalPrice bookingStatus')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all verification requests for this management (branch-filtered)
// @route GET /api/verification/all
const getAllRequests = async (req, res) => {
  try {
    // Management only sees requests matching their branch
    const filter = { branch: req.user.branch };

    const requests = await VerificationRequest.find(filter)
      .populate('borrowerId', 'name email branch phone collegeIdImage selfieImage profileImage')
      .populate({ path: 'itemId', select: 'itemName category pricePerDay image', populate: { path: 'ownerId', select: 'name email branch phone collegeIdImage selfieImage profileImage' } })
      .populate('bookingId', 'startDate endDate totalPrice bookingStatus managementVerificationStatus')
      .populate('managementId', 'name email branch')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Approve a verification request
// @route PUT /api/verification/approve/:id
const approveRequest = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Ensure this management belongs to the same branch as the request
    if (request.branch && request.branch !== req.user.branch) {
      return res.status(403).json({ message: 'You are not authorized to approve requests from other branches' });
    }

    request.status = 'Approved';
    request.managementId = req.user._id;
    request.remarks = req.body.remarks || '';
    await request.save();

    await Booking.findByIdAndUpdate(request.bookingId, {
      managementVerificationStatus: 'Approved',
      managementId: req.user._id,
    });

    res.json({ message: 'Request approved successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Reject a verification request
// @route PUT /api/verification/reject/:id
const rejectRequest = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Ensure this management belongs to the same branch as the request
    if (request.branch && request.branch !== req.user.branch) {
      return res.status(403).json({ message: 'You are not authorized to reject requests from other branches' });
    }

    request.status = 'Rejected';
    request.managementId = req.user._id;
    request.remarks = req.body.remarks || '';
    await request.save();

    await Booking.findByIdAndUpdate(request.bookingId, {
      managementVerificationStatus: 'Rejected',
      bookingStatus: 'Rejected',
      managementId: req.user._id,
    });

    res.json({ message: 'Request rejected', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get assigned management for a booking
// @route GET /api/verification/management/:bookingId
const getManagementForBooking = async (req, res) => {
  try {
    const request = await VerificationRequest.findOne({ bookingId: req.params.bookingId })
      .populate('managementId', 'name email role branch');

    if (request && request.managementId) {
      return res.json(request.managementId);
    }

    return res.status(404).json({ message: 'No management assigned for this booking' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPendingRequests, getAllRequests, approveRequest, rejectRequest, getManagementForBooking };

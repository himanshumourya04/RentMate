const express = require('express');
const router = express.Router();
const { 
  uploadFeedbackImage, 
  submitFeedback, 
  getAllFeedback, 
  updateFeedbackStatus, 
  deleteFeedback 
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

// Any logged-in user can submit feedback (students AND management)
router.post('/', protect, uploadFeedbackImage.single('screenshot'), submitFeedback);

// Only admin can view, update, and delete feedback
router.get('/', protect, authorize('admin'), getAllFeedback);
router.put('/:id', protect, authorize('admin'), updateFeedbackStatus);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;

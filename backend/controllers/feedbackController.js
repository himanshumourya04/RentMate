const Feedback = require('../models/Feedback');
const multer = require('multer');
const path = require('path');

// Multer config for optional feedback screenshot
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `feedback-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Images only'));
  }
};

const uploadFeedbackImage = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @desc  Submit user feedback
// @route POST /api/feedback
const submitFeedback = async (req, res) => {
  try {
    const { rating, feedbackType, message } = req.body;

    if (!rating || !feedbackType || !message) {
      return res.status(400).json({ message: 'Rating, Feedback Type, and Message are required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message cannot exceed 2000 characters' });
    }

    // Rate Limit Check: Max 3 feedbacks per user per day to prevent spam
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentFeedbacks = await Feedback.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: today }
    });

    if (recentFeedbacks >= 3) {
      return res.status(429).json({ message: 'You have reached the limit of 3 feedback submissions per day.' });
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      rating: Number(rating),
      feedbackType,
      message,
      screenshot: req.file ? req.file.filename : null,
    });

    res.status(201).json({ message: 'Thank you for your feedback!', feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all feedback (Admin/Management)
// @route GET /api/feedback
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update feedback status (Admin/Management)
// @route PUT /api/feedback/:id
const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Feedback not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete feedback (Admin/Management)
// @route DELETE /api/feedback/:id
const deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadFeedbackImage,
  submitFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback
};

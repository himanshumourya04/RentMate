const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  createRequest,
  getActiveRequests,
  getBanners,
  getRequestById,
  getMyRequests,
  closeRequest,
  reportRequest,
  updateRequest,
  deleteRequest
} = require('../controllers/requestController');

const { storage } = require('../config/cloudinary');
const upload = multer({ storage });


// ── Public Routes (visible without login) ──────────────────────
router.get('/banners', getBanners);       // Home page carousel
router.get('/', getActiveRequests);       // Query Dashboard feed

// ── Protected Routes (must be logged in) ───────────────────────
// IMPORTANT: /me MUST be before /:id to avoid Express matching "me" as an ObjectId
router.post('/', protect, upload.single('image'), createRequest);
router.get('/me', protect, getMyRequests);
router.put('/:id/close', protect, closeRequest);
router.post('/:id/report', protect, reportRequest);
router.put('/:id', protect, upload.single('image'), updateRequest);
router.delete('/:id', protect, deleteRequest);

// ── Public wildcard — must be LAST ─────────────────────────────
router.get('/:id', getRequestById);       // Single request detail

module.exports = router;

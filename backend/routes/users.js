const express = require('express');
const router = express.Router();
const { upload, updateProfile, getStudentDetails, getAllStudentsForManagement, getUserBasicInfo, getManagementByBranch } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Update profile (management = profileImage only; students = all fields)
router.put('/update-profile', protect, upload.single('profileImage'), updateProfile);

// Management: view all students' full identity details
router.get('/students', protect, getAllStudentsForManagement);

// Management/Admin: view single student's full identity details
router.get('/student/:id', protect, getStudentDetails);

// Any authenticated user: get basic info for chat initiation
router.get('/basic/:id', protect, getUserBasicInfo);

// Any authenticated user: get management team members of their branch
router.get('/management/branch', protect, getManagementByBranch);

module.exports = router;

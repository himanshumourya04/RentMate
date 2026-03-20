const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer config for profile image
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `profile-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Images only'));
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @desc  Update logged-in user's profile
// @route PUT /api/users/update-profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, branch } = req.body;
    const updateData = {};

    if (req.user.role === 'management') {
      // Management can ONLY update profile image
      if (req.file) updateData.profileImage = req.file.filename;
    } else {
      // Students / Admin can update name, phone, branch, profileImage
      if (name && name.trim()) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone;
      if (branch) updateData.branch = branch;
      if (req.file) updateData.profileImage = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      branch: updatedUser.branch,
      department: updatedUser.department,
      phone: updatedUser.phone,
      managementId: updatedUser.managementId,
      collegeIdImage: updatedUser.collegeIdImage,
      selfieImage: updatedUser.selfieImage,
      profileImage: updatedUser.profileImage,
      
      emailVerified: updatedUser.emailVerified,
      
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single student's full details (for management to view borrower/lender)
// @route GET /api/users/student/:id
const getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('name email phone branch collegeIdImage selfieImage profileImage role managementVerified');

    if (!student) return res.status(404).json({ message: 'User not found' });
    if (student.role !== 'student') return res.status(403).json({ message: 'Access restricted to student details' });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get any user's basic public info (for chat initiation)
// @route GET /api/users/basic/:id
const getUserBasicInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email branch profileImage role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all students (for management dashboard — borrower/lender view)
// @route GET /api/users/students
const getAllStudentsForManagement = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email phone branch collegeIdImage selfieImage profileImage managementVerified')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get management team members for the logged-in user's branch
// @route   GET /api/users/management/branch
// @access  Private
const getManagementByBranch = async (req, res) => {
  try {
    const userBranch = req.user.branch;
    
    if (!userBranch) {
      return res.status(400).json({ message: 'Your profile does not have an assigned branch.' });
    }

    const managementTeam = await User.find({
      role: 'management',
      branch: userBranch.toUpperCase()
    }).select('name email branch phone profileImage');

    res.json(managementTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { upload, updateProfile, getStudentDetails, getAllStudentsForManagement, getUserBasicInfo, getManagementByBranch };

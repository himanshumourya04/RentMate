const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const ItemRequest = require('../models/ItemRequest');
const Report = require('../models/Report');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── Admin Login ────────────────────────────────────────────────────────────
// POST /api/admin/login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid admin credentials' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── System Stats ───────────────────────────────────────────────────────────
// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalManagement, totalItems, activeRentals] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'management' }),
      Item.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'Active' }), // Fixed: field is bookingStatus, not status
    ]);
    res.json({ totalUsers, totalStudents, totalManagement, totalItems, activeRentals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Student Management ─────────────────────────────────────────────────────
// GET /api/admin/students
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/students/:id
const deleteStudent = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student account removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Management User Management (Admin creates/manages management accounts) ─────────
// GET /api/admin/management-users
const getAllManagementUsers = async (req, res) => {
  try {
    const management = await User.find({ role: 'management' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(management);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/management-users  — Admin creates a management account
const createManagementAccount = async (req, res) => {
  try {
    const { name, email, password, managementId, branch, phone } = req.body;

    if (!name || !email || !password || !managementId || !branch) {
      return res.status(400).json({
        message: 'Name, email, password, Management ID, and branch are all required.',
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const idExists = await User.findOne({ managementId, role: 'management' });
    if (idExists) {
      return res.status(400).json({ message: 'A management member with this Management ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const management = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'management',
      managementId,
      branch,
      department: branch,
      phone: phone || '',
      emailVerified: true,
      managementVerified: true,
    });

    const { password: _pw, ...managementData } = management.toObject();
    res.status(201).json(managementData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/management-users/:id  — Admin updates management details
const updateManagementAccount = async (req, res) => {
  try {
    const { name, email, managementId, branch, phone } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (managementId) updateData.managementId = managementId;
    if (branch) updateData.branch = branch;
    if (phone !== undefined) updateData.phone = phone;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'Management not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/management-users/:id
const deleteManagementUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Management account removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Item Management ─────────────────────────────────────────────────────────
// GET /api/admin/items
const getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('ownerId', 'name email branch')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/items/:id
const adminDeleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Request & Report Management ──────────────────────────────────────────────
// GET /api/admin/requests
const getAllRequestsAdmin = async (req, res) => {
  try {
    const filter = {};
    // Strict branch-based filtering for Management Team
    if (req.user.role === 'management' && req.user.branch) {
      filter.branch = req.user.branch.toUpperCase();
    }

    const requests = await ItemRequest.find(filter)
      .populate('userId', 'name email branch')
      .sort({ createdAt: -1 });

    const BASE = process.env.BACKEND_URL || 'http://localhost:5000';
    const formattedRequests = requests.map(req => {
      let imageUrl = null;
      if (typeof req.image === 'string') {
        imageUrl = req.image.startsWith('http') ? req.image : `${BASE}/uploads/${req.image}`;
      } else if (req.image && req.image.url) {
        imageUrl = req.image.url.startsWith('http') ? req.image.url : `${BASE}${req.image.url}`;
      }
      return { ...req.toObject(), image: imageUrl };
    });

    res.json(formattedRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/requests/:id
const deleteRequestAdmin = async (req, res) => {
  try {
    await ItemRequest.findByIdAndDelete(req.params.id);
    
    // Also cleanup any reports associated with this request
    await Report.deleteMany({ requestId: req.params.id });

    res.json({ message: 'Request removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reports
const getReportsAdmin = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .populate({
        path: 'requestId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/reports/:id/resolve
const resolveReportAdmin = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Toggle the pinned status of a request
// @route PUT /api/admin/requests/:id/pin
const togglePinRequestAdmin = async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.isPinned = !request.isPinned;
    await request.save();

    res.json({ message: `Request ${request.isPinned ? 'pinned' : 'unpinned'} successfully`, isPinned: request.isPinned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create an admin banner (generic announcement)
// @route POST /api/admin/banners
const createAdminBanner = async (req, res) => {
  try {
    const { itemName, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Admin banners basically never expire automatically

    const BASE = process.env.BACKEND_URL || 'http://localhost:5000';
    const isCloudinary = req.file.path && req.file.path.startsWith('http');
    const imageData = isCloudinary
      ? { url: req.file.path, public_id: req.file.filename }
      : { url: `${BASE}/uploads/${req.file.filename}`, public_id: req.file.filename };

    const newBanner = await ItemRequest.create({
      itemName: itemName || 'Announcement',
      description: description || '',
      type: 'admin',
      image: imageData,
      expiresAt
    });

    res.status(201).json(newBanner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update any banner fully
// @route PUT /api/admin/banners/:id
const updateBannerAdmin = async (req, res) => {
  try {
    const { itemName, description, isPinned, type } = req.body;
    const request = await ItemRequest.findById(req.params.id);
    
    if (!request) return res.status(404).json({ message: 'Banner not found' });

    if (itemName !== undefined) request.itemName = itemName;
    if (description !== undefined) request.description = description;
    if (isPinned !== undefined) request.isPinned = isPinned === 'true' || isPinned === true;
    if (type !== undefined) request.type = type;

    if (req.file) {
      const BASE = process.env.BACKEND_URL || 'http://localhost:5000';
      const isCloudinary = req.file.path && req.file.path.startsWith('http');
      const imageData = isCloudinary
        ? { url: req.file.path, public_id: req.file.filename }
        : { url: `${BASE}/uploads/${req.file.filename}`, public_id: req.file.filename };
      request.image = imageData;
    }

    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  adminLogin, getStats,
  getAllStudents, deleteStudent,
  getAllManagementUsers, createManagementAccount, updateManagementAccount, deleteManagementUser,
  getAllItems, adminDeleteItem,
  getAllRequestsAdmin, deleteRequestAdmin, getReportsAdmin, resolveReportAdmin, togglePinRequestAdmin,
  createAdminBanner, updateBannerAdmin
};

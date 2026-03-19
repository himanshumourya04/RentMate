const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  adminLogin,
  getStats,
  getAllStudents, deleteStudent,
  getAllManagementUsers, createManagementAccount, updateManagementAccount, deleteManagementUser,
  getAllItems, adminDeleteItem,
  getAllRequestsAdmin, deleteRequestAdmin, getReportsAdmin, resolveReportAdmin, togglePinRequestAdmin,
  createAdminBanner, updateBannerAdmin
} = require('../controllers/adminController');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `admin-banner-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Public admin login (no middleware)
router.post('/login', adminLogin);

// All routes below require admin JWT
router.get('/stats', adminMiddleware, getStats);

// Student management
router.get('/students', adminMiddleware, getAllStudents);
router.delete('/students/:id', adminMiddleware, deleteStudent);

// Management user management — creates real User accounts
router.get('/management-users', adminMiddleware, getAllManagementUsers);
router.post('/management-users', adminMiddleware, createManagementAccount);
router.put('/management-users/:id', adminMiddleware, updateManagementAccount);
router.delete('/management-users/:id', adminMiddleware, deleteManagementUser);

// Item management
router.get('/items', adminMiddleware, getAllItems);
router.delete('/items/:id', adminMiddleware, adminDeleteItem);

// Query Dashboard Requests & Admin Banners
router.get('/requests', adminMiddleware, getAllRequestsAdmin);
router.delete('/requests/:id', adminMiddleware, deleteRequestAdmin);
router.put('/requests/:id/pin', adminMiddleware, togglePinRequestAdmin);

router.post('/banners', adminMiddleware, upload.single('image'), createAdminBanner);
router.put('/banners/:id', adminMiddleware, upload.single('image'), updateBannerAdmin);

router.get('/reports', adminMiddleware, getReportsAdmin);
router.put('/reports/:id/resolve', adminMiddleware, resolveReportAdmin);

module.exports = router;

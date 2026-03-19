const express = require('express');
const router = express.Router();
const {
  upload,
  addItem,
  getItems,
  getItemById,
  getMyListings,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');

router.get('/', getItems);
router.get('/my-items', protect, getMyListings);
router.get('/:id', getItemById);
router.post('/add', protect, upload.single('image'), addItem);
router.put('/:id', protect, upload.single('image'), updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;

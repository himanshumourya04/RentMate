const multer = require('multer');
const Item = require('../models/Item');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// @desc  Add a new item
// @route POST /api/items/add
const addItem = async (req, res) => {
  try {
    const { itemName, description, category, pricePerDay, condition } = req.body;
    if (!itemName || !description || !category || !pricePerDay) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    const image = req.file ? req.file.path : '';
    const item = await Item.create({
      itemName,
      description,
      category,
      pricePerDay: Number(pricePerDay),
      ownerId: req.user._id,
      image,
      condition: condition || 'Good',
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all items (with optional search + category filter)
// @route GET /api/items
const getItems = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    const items = await Item.find(query).populate('ownerId', 'name email department').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get item by ID
// @route GET /api/items/:id
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('ownerId', 'name email department phone');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get owner's listings
// @route GET /api/items/mylistings
const getMyListings = async (req, res) => {
  try {
    const items = await Item.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update item
// @route PUT /api/items/:id
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    const { itemName, description, category, pricePerDay, availability, condition } = req.body;
    if (itemName) item.itemName = itemName;
    if (description) item.description = description;
    if (category) item.category = category;
    if (pricePerDay !== undefined) item.pricePerDay = Number(pricePerDay);
    if (availability !== undefined) item.availability = availability;
    if (condition) item.condition = condition;
    if (req.file) item.image = req.file.path;
    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete item
// @route DELETE /api/items/:id
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { upload, addItem, getItems, getItemById, getMyListings, updateItem, deleteItem };

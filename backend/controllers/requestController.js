const ItemRequest = require('../models/ItemRequest');
const Report = require('../models/Report');

// @desc  Create a new item request
// @route POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { itemName, description, branch, duration } = req.body;

    // Must upload an image
    if (!req.file) {
      return res.status(400).json({ message: 'Item image photo is required' });
    }

    // Rate limiting: max 5 per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const requestCount = await ItemRequest.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: startOfDay }
    });

    if (requestCount >= 5) {
      return res.status(429).json({ message: 'You have reached the limit of 5 requests per day.' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // 2 day expiry for user requests

    // Support both Cloudinary uploaded files and local multer files.
    // Cloudinary sets req.file.path to an https:// URL; local multer sets it to the filesystem path.
    const isCloudinary = req.file.path && req.file.path.startsWith('http');
    const imageData = isCloudinary
      ? { url: req.file.path, public_id: req.file.filename }
      : { url: `http://localhost:5000/uploads/${req.file.filename}`, public_id: req.file.filename };

    const newRequest = await ItemRequest.create({
      userId: req.user._id,
      itemName,
      description,
      branch,
      duration: duration || '1 week',
      image: imageData,
      type: 'user',
      expiresAt
    });

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all active requests (feed)
// @route GET /api/requests
const getActiveRequests = async (req, res) => {
  try {
    const { branch } = req.query;
    
    const filter = {
      status: 'active',
      type: 'user', // Query Dashboard only shows user requests
      expiresAt: { $gt: new Date() } // not expired
    };
    
    if (branch) filter.branch = branch;

    const requests = await ItemRequest.find(filter)
      .populate('userId', 'name profileImage branch')
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map(req => {
      let imageUrl = null;
      if (typeof req.image === 'string') {
        imageUrl = req.image.startsWith('http') ? req.image : `http://localhost:5000/uploads/${req.image}`;
      } else if (req.image && req.image.url) {
        imageUrl = req.image.url.startsWith('http') ? req.image.url : `http://localhost:5000${req.image.url}`;
      }
      return { ...req.toObject(), image: imageUrl };
    });

    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get active banners for home page carousel
// @route GET /api/requests/banners
const getBanners = async (req, res) => {
  try {
    const filter = {
      status: 'active',
      expiresAt: { $gt: new Date() } // not expired
    };

    // Fetch requests sorted by isPinned (true first), then admin announcements, then newest user
    const banners = await ItemRequest.find(filter)
      .populate('userId', 'name profileImage branch')
      .sort({ isPinned: -1, type: 1, createdAt: -1 }) // type:1 puts 'admin' before 'user'
      .limit(10); // Limit to top 10 for the carousel

    const formattedBanners = banners.map(banner => {
      let imageUrl = null;
      if (typeof banner.image === 'string') {
        imageUrl = banner.image.startsWith('http') ? banner.image : `http://localhost:5000/uploads/${banner.image}`;
      } else if (banner.image && banner.image.url) {
        imageUrl = banner.image.url.startsWith('http') ? banner.image.url : `http://localhost:5000${banner.image.url}`;
      }
      return { ...banner.toObject(), image: imageUrl };
    });

    res.json(formattedBanners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single request by ID
// @route GET /api/requests/:id
const getRequestById = async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id)
      .populate('userId', 'name profileImage branch collegeIdImage phone managementVerified');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get logged-in user's requests
// @route GET /api/requests/me
const getMyRequests = async (req, res) => {
  try {
    const requests = await ItemRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Mark a request as closed manually
// @route PUT /api/requests/:id/close
const closeRequest = async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only close your own requests.' });
    }

    request.status = 'closed';
    await request.save();

    res.json({ message: 'Request closed successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Report an inappropriate request
// @route POST /api/requests/:id/report
const reportRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      requestId: req.params.id,
      reason
    });

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update an item request
// @route PUT /api/requests/:id
const updateRequest = async (req, res) => {
  try {
    const { itemName, description, branch, duration } = req.body;
    let request = await ItemRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Authorization: Admin or Owner
    if (request.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this request.' });
    }

    // Update fields
    if (itemName) request.itemName = itemName;
    if (description !== undefined) request.description = description;
    if (branch) request.branch = branch;
    if (duration) request.duration = duration;

    // Handle new image upload
    if (req.file) {
      const isCloudinary = req.file.path && req.file.path.startsWith('http');
      const imageData = isCloudinary
        ? { url: req.file.path, public_id: req.file.filename }
        : { url: `http://localhost:5000/uploads/${req.file.filename}`, public_id: req.file.filename };
      request.image = imageData;
    }

    await request.save();
    res.json({ message: 'Request updated successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete an item request
// @route DELETE /api/requests/:id
const deleteRequest = async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Authorization: Admin or Owner
    if (request.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this request.' });
    }

    await ItemRequest.findByIdAndDelete(req.params.id);
    
    // Clean up associated reports
    await Report.deleteMany({ requestId: req.params.id });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getActiveRequests,
  getBanners,
  getRequestById,
  getMyRequests,
  closeRequest,
  reportRequest,
  updateRequest,
  deleteRequest
};

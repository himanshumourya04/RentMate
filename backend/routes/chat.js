const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/chat/conversations
// Fetch all conversations for the logged-in user with unread counts
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'name email role department')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    // Calculate unread counts for each conversation
    const enhancedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: req.user.id,
          read: false
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    res.json(enhancedConversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/chat/unread-count
// Get total unread CONVERSATION count (total unseen users)
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadConvs = await Message.distinct('conversationId', {
      receiverId: req.user.id,
      read: false
    });
    res.json({ count: unreadConvs.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/chat/read/:conversationId
// Mark all messages in a conversation as read for the current user
router.put('/read/:conversationId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        conversationId: req.params.conversationId, 
        receiverId: req.user.id,
        read: false 
      },
      { $set: { read: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/chat/messages/:conversationId
// Fetch message history for a specific conversation
router.get('/messages/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Ensure directory exists (use absolute path to be safe regardless of server cwd)
const fs = require('fs');
const chatUploadsDir = path.join(__dirname, '../uploads/chat/');
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// POST /api/chat/upload
// Handle file uploads for chat
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({
    fileUrl: `/uploads/chat/${req.file.filename}`,
    fileType: req.file.mimetype,
    fileName: req.file.originalname
  });
});

// POST /api/chat/message
// Save new message and update conversation
router.post('/message', auth, async (req, res) => {
  try {
    const { conversationId, messageText, receiverId, fileUrl, fileType } = req.body;
    
    // Verify conversation exists or create it if not provided (for new chats)
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else if (receiverId) {
      conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, receiverId] }
      });
      
      if (!conversation) {
        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ message: 'Receiver not found' });
        
        conversation = new Conversation({
          participants: [req.user.id, receiverId]
        });
        await conversation.save();
      }
    }

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const actualReceiverId = receiverId || conversation.participants.find(p => p.toString() !== req.user.id);
    
    // Fetch user details for validation
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(actualReceiverId);
    
    // STEP 9: FRONTEND SAFETY FIX
    console.log("receiverId:", receiverId);
    // STEP 1: DEBUG LOGGING
    console.log("Sender:", sender?.role, sender?.branch);
    console.log("Receiver:", receiver?.role, receiver?.branch);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // STEP 3: FIX VALIDATION LOGIC (FINAL) - STEP 4: FIX ROLE CHECK
    if (sender.role === 'management' || receiver.role === 'management') {
      // STEP 2: NORMALIZE BRANCH VALUES
      const sBranch = sender.branch ? sender.branch.trim().toUpperCase() : '';
      const rBranch = receiver.branch ? receiver.branch.trim().toUpperCase() : '';

      if (sBranch !== rBranch) {
        return res.status(403).json({ message: 'Unauthorized communication: Branch mismatch' });
      }
    }

    console.log(`Chat initiated successfully`);

    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: req.user.id,
      receiverId: actualReceiverId,
      messageText: messageText || '',
      fileUrl,
      fileType
    });

    const message = await newMessage.save();

    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate('senderId', 'name email role');

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/chat/search?query=...
// Search users by name or email
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);
        
        const queryObj = mongoose.Types.ObjectId.isValid(query) 
            ? { _id: query }
            : {
                $and: [
                    { _id: { $ne: req.user.id } },
                    {
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { email: { $regex: query, $options: 'i' } }
                        ]
                    }
                ]
            };

        const users = await User.find(queryObj).select('name email role department').limit(10);
        
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

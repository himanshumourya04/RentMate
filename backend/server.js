const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Allowed frontend origins (comma-separated in CLIENT_URL env var)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

// Dynamic CORS origin function - accepts any vercel.app domain + explicit origins
const corsOrigin = (origin, callback) => {
  // Allow requests with no origin (Postman, mobile apps, curl)
  if (!origin) return callback(null, true);
  // Allow any vercel.app subdomain automatically
  if (origin.endsWith('.vercel.app')) return callback(null, true);
  // Allow origins explicitly listed in CLIENT_URL
  if (allowedOrigins.includes(origin)) return callback(null, true);
  // Block everything else
  console.warn(`[CORS] Blocked request from: ${origin}`);
  callback(new Error(`CORS: origin ${origin} is not allowed`));
};

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});


// Store connected users: { userId: socketId }
let connectedUsers = {};

// Socket.io connection handling
io.on('connection', (socket) => {

  // User registers their connection
  socket.on('registerUser', (userId) => {
    connectedUsers[userId] = socket.id;
  });

  // sendMessage event
  socket.on('sendMessage', async (messageData) => {
    const { senderId, receiverId, messageText, conversationId } = messageData;

    try {
      // Find receiver's socketId
      const receiverSocketId = connectedUsers[receiverId];

      // Emit to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', messageData);
      }

      // Also emit back to sender (as requested)
      socket.emit('receiveMessage', messageData);
      
    } catch (err) {
      console.error('Socket sendMessage error:', err);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from connectedUsers mapping
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Step 6: Create test email API (GET /api/test-email)
app.get('/api/test-email', async (req, res) => {
  const { sendEmail } = require('./utils/sendEmail');
  const to = req.query.to || process.env.EMAIL_FROM;
  if (!to) {
    return res.status(400).json({ message: 'Please provide ?to=email parameter' });
  }
  try {
    await sendEmail({
      to,
      subject: 'RentMate Test',
      html: 'This is a test email.'
    });
    res.json({ message: `✅ Test email sent to ${to}` });
  } catch (err) {
    console.error('Test email failed:', err);
    res.status(500).json({ message: 'Email failed', error: err.message });
  }
});

// Basic health check route
app.get('/', (req, res) => res.send(`RentMate API is running! Date: ${new Date().toISOString()} Version: 4`));
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: 4, timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ RentMate server running on http://localhost:${PORT}`);

  // ── Keep-Alive Ping ──────────────────────────────────────────────────────
  // Render free tier shuts down after 15 min of inactivity → 50+ sec cold starts.
  // We ping /api/health every 14 min to keep the server warm in production only.
  if (process.env.RENDER_EXTERNAL_URL) {
    const keepAliveUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
    setInterval(() => {
      http.get(keepAliveUrl, (res) => {
        console.log(`[keep-alive] ping → ${keepAliveUrl} | status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn(`[keep-alive] ping failed:`, err.message);
      });
    }, 14 * 60 * 1000); // every 14 minutes
    console.log(`🔁 Keep-alive ping active → ${keepAliveUrl}`);
  }
});


const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const Sentiment = require('sentiment');
require("dotenv").config();
const connectDB = require("./config/db");

process.env.JWT_SECRET = process.env.JWT_SECRET 

const sentiment = new Sentiment();


const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "https://thechat-1.onrender.com", "https://thechat-frontend.onrender.com", "https://brochat-frontend.onrender.com"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Web Push
const webpush = require('web-push');
// Load VAPID keys from env or generate new ones and print a warning
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.warn('VAPID keys are missing in environment. Web Push will not work until keys are provided.');
} else {
  webpush.setVapidDetails(
    'mailto:admin@thechat.example',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

// Simple in-memory subscriptions store (replace with DB for production)
const subscriptions = new Map();

app.get('/vapidPublicKey', (req, res) => {
  if (!VAPID_PUBLIC) return res.status(500).json({ error: 'VAPID key not configured' });
  res.json({ publicKey: VAPID_PUBLIC });
});


const User = require('./models/User');
const authRoutes = require('./Routes/AuthRoute');
app.use('/', authRoutes);


const activeUsers = new Map();


function analyzeEmotion(text) {
  const result = sentiment.analyze(text);
  let emotionType = 'neutral';
  let emoji = '😐';

  if (result.score > 2) {
    emotionType = 'very-positive';
    emoji = '😄';
  } else if (result.score > 0) {
    emotionType = 'positive';
    emoji = '😊';
  } else if (result.score < -2) {
    emotionType = 'very-negative';
    emoji = '😢';
  } else if (result.score < 0) {
    emotionType = 'negative';
    emoji = '😕';
  }

  return {
    sentiment: emotionType,
    score: result.score,
    emoji: emoji
  };
}

connectDB()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('username profilePicture');
      
      if (user) {
        socket.userId = decoded.id;
        socket.username = user.username;
        activeUsers.set(decoded.id, {
          socketId: socket.id,
          username: user.username,
          profilePicture: user.profilePicture
        });
        
     
        io.emit('userCountUpdate', {
          count: activeUsers.size,
          onlineUsers: Array.from(activeUsers.values()).map(u => ({
            username: u.username,
            profilePicture: u.profilePicture
          }))
        });
        
        console.log(`User ${user.username} authenticated and joined`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authError', 'Invalid token');
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      
     
      io.emit('userCountUpdate', {
        count: activeUsers.size,
        onlineUsers: Array.from(activeUsers.values()).map(u => ({
          username: u.username,
          profilePicture: u.profilePicture
        }))
      });
      
      console.log(`User ${socket.username} disconnected`);
    }
  });
});
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Push notification subscription endpoints (must be after authenticateToken is defined)
app.post('/subscribe', authenticateToken, (req, res) => {
  const sub = req.body.subscription;
  if (!sub) return res.status(400).json({ error: 'Subscription required' });
  subscriptions.set(req.user.id, sub);
  res.json({ message: 'Subscribed' });
});

app.post('/unsubscribe', authenticateToken, (req, res) => {
  subscriptions.delete(req.user.id);
  res.json({ message: 'Unsubscribed' });
});


const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },      
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  message: { type: String, default: "" },
  fileUrl: String,
  fileName: String,
  emotion: {
    sentiment: String,  
    score: Number,      
    emoji: String       
  },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track who has seen this message
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);


const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });




app.post("/messages", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message && !req.file) {
      return res.status(400).json({ error: "Message or file required" });
    }

    
    const authenticatedUser = await User.findById(req.user.id);
    if (!authenticatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let fileUrl = null;
    if (req.file) fileUrl = `https://brochat2.onrender.com/uploads/${req.file.filename}`;

    // Analyze emotion if there's a text message
    let emotion = null;
    if (message && message.trim()) {
      emotion = analyzeEmotion(message);
    }

    const newMessage = new Message({
      user: authenticatedUser.username, 
      userId: authenticatedUser._id,   
      message: message || "",
      fileUrl,
      fileName: req.file ? req.file.originalname : null,
      emotion: emotion,
      seenBy: [authenticatedUser._id] // Sender automatically sees their own message
    });

    await newMessage.save();
    
    // Broadcast new message to all connected users
    const messageWithUserData = {
      ...newMessage.toObject(),
      user: authenticatedUser.username,
      userProfilePicture: authenticatedUser.profilePicture,
      seenCount: 1, // Sender has seen it
      seenByCurrentUser: false // Will be true for sender on their end
    };
    
    io.emit('newMessage', messageWithUserData);
    
    // Send notification to all users (including sender for confirmation)
    io.emit('notification', {
      type: 'newMessage',
      message: `${authenticatedUser.username} sent a message`,
      user: authenticatedUser.username,
      profilePicture: authenticatedUser.profilePicture,
      timestamp: new Date(),
      senderId: authenticatedUser._id.toString() // Add sender ID so frontend can handle it
    });

    // Also send web-push notifications to subscribed users
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      const payload = JSON.stringify({
        title: 'New message',
        body: `${authenticatedUser.username}: ${message ? message.slice(0, 100) : 'Sent a file'}`,
        icon: authenticatedUser.profilePicture || '/favicon.ico',
        url: '/chat'
      });

      subscriptions.forEach((sub, userId) => {
        try {
          webpush.sendNotification(sub, payload).catch(err => {
            console.error('Push error for user', userId, err);
            // remove invalid subscription
            if (err.statusCode === 410 || err.statusCode === 404) subscriptions.delete(userId);
          });
        } catch (err) {
          console.error('Push send exception:', err);
        }
      });
    }


    
    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/messages", authenticateToken, async (req, res) => {
  try {
   
    const messages = await Message.find({ userId: { $exists: true, $ne: null } }).sort({ createdAt: 1 });
  
    const messagesWithCurrentUserData = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.userId) {
          return {
            ...msg.toObject(),
            userProfilePicture: null,
            seenByCurrentUser: false,
            seenCount: msg.seenBy ? msg.seenBy.length : 0
          };
        }
        
        const user = await User.findById(msg.userId).select('username profilePicture');
        const seenByCurrentUser = msg.seenBy && msg.seenBy.some(id => id.toString() === req.user.id);
        
        return {
          ...msg.toObject(),
          user: user ? user.username : msg.user, 
          userProfilePicture: user ? user.profilePicture : null,
          seenByCurrentUser,
          seenCount: msg.seenBy ? msg.seenBy.length : 0
        };
      })
    );

    
    res.json(messagesWithCurrentUserData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark messages as seen
app.post("/messages/mark-seen", authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: "messageIds array required" });
    }

    // Update all messages to add current user to seenBy array if not already there
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        seenBy: { $ne: userId } // Only update if user hasn't seen it yet
      },
      { 
        $addToSet: { seenBy: userId } // Add user ID to seenBy array
      }
    );

    // Emit socket event to notify other users that messages were seen
    io.emit('messages-seen', { userId, messageIds });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/profile-picture", authenticateToken, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }


    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: "Please upload an image file" });
    }

    const profilePictureUrl = `https://brochat2.onrender.com/uploads/${req.file.filename}`;
    
  
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    res.json({ 
      message: "Profile picture updated successfully",
      user: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/debug/messages", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/cleanup/messages", authenticateToken, async (req, res) => {
  try {
    const result = await Message.deleteMany({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    res.json({ 
      message: `Cleaned up ${result.deletedCount} messages without userId`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.use("/uploads", express.static(uploadDir));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


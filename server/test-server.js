import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

// CORS Middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Test posts data
let testPosts = [
  {
    _id: "test1",
    content: "Test flood report in Mumbai area - Emergency situation!",
    location: "19.0760, 72.8777",
    severityPrediction: "high_risk",
    createdAt: new Date(),
    files: []
  },
  {
    _id: "test2", 
    content: "Heavy rainfall causing waterlogging in Delhi",
    location: "28.6139, 77.2090",
    severityPrediction: "mild_risk",
    createdAt: new Date(Date.now() - 3600000),
    files: []
  },
  {
    _id: "test3", 
    content: "Storm approaching coastal areas, urgent evacuation needed",
    location: "11.0168, 76.9558",
    severityPrediction: "high_risk",
    createdAt: new Date(Date.now() - 7200000),
    files: []
  }
];

// Routes
app.get("/", (req, res) => {
  res.send("✅ VARUNA Test Server is running!");
});

// Get all posts
app.get("/api/posts", (req, res) => {
  console.log("📋 Sending test posts:", testPosts.length);
  res.json(testPosts);
});

// Create new post
app.post("/api/posts", (req, res) => {
  const { content, location } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }
  
  // Simple keyword-based severity classification
  const lowerContent = content.toLowerCase();
  let severity = "low_risk";
  
  if (lowerContent.includes("emergency") || lowerContent.includes("urgent") || 
      lowerContent.includes("flood") || lowerContent.includes("tsunami") ||
      lowerContent.includes("cyclone") || lowerContent.includes("fire") ||
      lowerContent.includes("earthquake")) {
    severity = "high_risk";
  } else if (lowerContent.includes("storm") || lowerContent.includes("damage") ||
             lowerContent.includes("warning") || lowerContent.includes("heavy rain")) {
    severity = "mild_risk";
  }
  
  const newPost = {
    _id: `test_${Date.now()}`,
    content,
    location: location || "Unknown location",
    severityPrediction: severity,
    createdAt: new Date(),
    files: []
  };
  
  testPosts.unshift(newPost);
  console.log("✅ Created new post:", newPost);
  
  // Emit via socket
  io.emit('newPost', newPost);
  console.log("📡 Emitted newPost via socket");
  
  res.status(201).json(newPost);
});

// Auth status (mock)
app.get("/api/auth/status", (req, res) => {
  res.json({
    success: true,
    user: {
      name: "Test User",
      email: "test@varuna.com",
      id: "test123"
    }
  });
});

// Socket connection log
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ VARUNA Test Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled for real-time updates`);
  console.log(`📋 Test posts available: ${testPosts.length}`);
});
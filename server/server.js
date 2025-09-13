import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/AuthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import coastRoutes from "./routes/coastRoutes.js";
import incoisRoutes from "./routes/incoisRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://incios-ocean-disaster-management.onrender.com",
  "https://incios-ocean-disaster-management.vercel.app",
];

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
  // Add transport configuration
  transports: ["polling", "websocket"],
  allowEIO3: true
});

app.set("io", io);

// CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/disasters", mapRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/alerts", coastRoutes);
app.use("/api/incois", incoisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// Root API check
app.get("/", (req, res) => {
  res.send("Disaster Management API is running...");
});

// Enhanced Socket connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Send welcome message to connected client
  socket.emit("connected", { message: "Successfully connected to disaster management server" });
  
  // Handle client requests for initial data
  socket.on("requestPosts", async () => {
    try {
      // You can emit recent posts here if needed
      console.log("Client requested posts");
    } catch (error) {
      console.error("Error handling requestPosts:", error);
    }
  });
  
  // Handle zone updates request
  socket.on("requestZones", async () => {
    try {
      console.log("Client requested zones");
      // You can emit current zones here if needed
    } catch (error) {
      console.error("Error handling requestZones:", error);
    }
  });
  
  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error);
  });
});

// Health check for socket.io
app.get("/api/socket/health", (req, res) => {
  res.json({
    status: "ok",
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready on port ${PORT}`);
});
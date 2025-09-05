// index.js or server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

// Import routes
import authRoutes from "./routes/AuthRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import coastRoutes from "./routes/coastRoutes.js";
import incoisRoutes from "./routes/incoisRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173", 
  "https://incios-ocean-disaster-management.onrender.com", 
];

// socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// attach io globally so routes can use it
app.set("io", io);

// Express Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/disasters", mapRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/coast", coastRoutes);
app.use("/api/incois", incoisRoutes);

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

// socket connection log
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

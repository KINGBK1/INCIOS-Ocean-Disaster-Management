import express from "express";
import { register, login, googleLogin, approveUser } from "../controllers/authController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/status", authMiddleware, (req, res) => {
  const user = req.user;
  const userData = {
    id: user._id,
    name: user.username,
    email: user.email,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
    avatar: user.picture || null,
    role: user.role,
    officialId: user.officialId,
    isApproved: user.isApproved,
    preferences: user.preferences,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  };
  res.json({ success: true, user: userData });
});

// only admin can approve NGO/DDMO/Admin signups
// Changed "admin" to ["admin"]
router.patch("/approve/:id", authMiddleware, roleMiddleware(["admin"]), approveUser);

// miscellaneous routes
//For Pinging the server after every 5 mins
router.get("/ping", (req, res) => {
  res.json({ message: "Pong" });
});

export default router;
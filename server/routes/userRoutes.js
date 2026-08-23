import express from "express";
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  updateUserPreferences, 
  deleteUserAccount 
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user profile
router.get("/profile", getUserProfile);

// Update user profile (with optional file upload for avatar)
router.put("/profile", upload.single("avatar"), updateUserProfile);

// Change password
router.put("/change-password", changePassword);

// Update user preferences
router.put("/preferences", updateUserPreferences);

// Delete user account
router.delete("/account", deleteUserAccount);

export default router;
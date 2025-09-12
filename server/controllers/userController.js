import User from "../models/UserModel.js";
import cloudinary from "../config/cloudinary.js";
import bcrypt from "bcryptjs";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      id: user._id,
      name: user.username,
      email: user.email,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
      avatar: user.picture,
      role: user.role,
      officialId: user.officialId,
      isApproved: user.isApproved,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, location, bio } = req.body;
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Handle avatar upload if provided
    let pictureUrl = user.picture;
    if (req.file) {
      try {
        // Upload to cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "user_avatars",
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });

        pictureUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(400).json({ message: "Failed to upload image" });
      }
    }

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username: name || user.username,
        email: email || user.email,
        phone: phone || user.phone,
        location: location || user.location,
        bio: bio || user.bio,
        picture: pictureUrl
      },
      { new: true, runValidators: true }
    ).select("-password");

    const userData = {
      id: updatedUser._id,
      name: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      location: updatedUser.location,
      bio: updatedUser.bio,
      avatar: updatedUser.picture,
      role: updatedUser.role,
      officialId: updatedUser.officialId,
      isApproved: updatedUser.isApproved,
      preferences: updatedUser.preferences,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    };

    res.json({ success: true, user: userData, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(400).json({ message: "Cannot change password for social login accounts" });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user preferences
export const updateUserPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.id;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: "Valid preferences object is required" });
    }

    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      success: true, 
      preferences: updatedUser.preferences,
      message: "Preferences updated successfully" 
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user account
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has a profile picture on cloudinary, delete it
    if (user.picture && user.picture.includes("cloudinary.com")) {
      try {
        const publicId = user.picture.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`user_avatars/${publicId}`);
      } catch (deleteImageError) {
        console.error("Error deleting user image:", deleteImageError);
        // Continue with account deletion even if image deletion fails
      }
    }

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
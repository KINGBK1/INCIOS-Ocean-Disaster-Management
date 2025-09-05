import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import { OAuth2Client } from "google-auth-library";

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// regular signup
export const register = async (req, res) => {
  try {
    const { username, email, password, role, officialId, location } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (role !== "user" && !officialId) {
      return res.status(400).json({ message: "Official ID is required for this role" });
    }

    if (role === "user" && !password) {
      return res.status(400).json({ message: "Password is required for regular users" });
    }

    // Check uniqueness
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Create user
    const user = new User({
      username,
      email: email || undefined, // email optional
      password,
      role,
      officialId: role !== "user" ? officialId : undefined,
      location,
      isApproved: role === "user" ? true : false
    });

    await user.save();

    //  Response
    if (user.role !== "user") {
      return res.status(201).json({
        message: "Account created. Awaiting admin approval.",
        user
      });
    }

    const token = generateToken(user._id, user.role);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
  }
};


// google login/signup for regular user
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, username: name, picture, role: "user", isApproved: true });
      await user.save();
    }

    const jwtToken = generateToken(user._id, user.role);
    res.json({ token: jwtToken, user });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed" });
  }
};

// login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Account pending admin approval" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// approve accounts (admin only)
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    res.json({ message: "User approved", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

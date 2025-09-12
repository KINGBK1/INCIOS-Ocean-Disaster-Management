import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, trim: true },
  email: { type: String, lowercase: true, unique: true, sparse: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String },
  role: { 
    type: String, 
    enum: ["user", "admin", "ngo", "ddmo"], 
    default: "user" 
  },
  officialId: { type: String }, // for admin/ngo/ddmo signup
  location: { type: String },
  phone: { type: String },
  bio: { type: String },
  isApproved: { type: Boolean, default: function() {
    return this.role === "user"; // auto-approved if regular user
  }},
  picture: { type: String },
  preferences: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
    emergencyAlerts: { type: Boolean, default: true }
  },
  lastLogin: { type: Date }
}, { timestamps: true });

// password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// password check
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);

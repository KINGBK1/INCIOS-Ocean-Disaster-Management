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
  
  // NGO-specific fields
  ngoDetails: {
    organizationName: { type: String },
    registrationNumber: { type: String },
    address: { type: String },
    serviceRadius: { type: Number, default: 50000 }, // 50km in meters
    specializations: [{ type: String }], // e.g., ["flood relief", "medical aid", "shelter"]
    contactPerson: { type: String },
    emergencyContact: { type: String },
    availableResources: {
      volunteers: { type: Number, default: 0 },
      vehicles: { type: Number, default: 0 },
      medicalSupplies: { type: Boolean, default: false },
      foodSupplies: { type: Boolean, default: false },
      shelterCapacity: { type: Number, default: 0 }
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  preferences: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
    emergencyAlerts: { type: Boolean, default: true }
  },
  
  // Alert history for tracking
  alertsReceived: [{
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    alertType: { type: String },
    receivedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }],
  
  lastLogin: { type: Date }
}, { timestamps: true });

// password hashing - FIXED
userSchema.pre("save", async function (next) {
  // Skip if password doesn't exist or wasn't modified
  if (!this.isModified("password") || !this.password) return next();
  
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// password check
userSchema.methods.comparePassword = async function (enteredPassword) {
  // Return false if no password exists (for NGO/admin/ddmo accounts)
  if (!this.password) return false;
  
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
import mongoose from "mongoose";

const ngoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: { type: String },
  address: { type: String },
  verified: { type: Boolean, default: false }, // Approved by admin/DDMO
  role: { type: String, default: "ngo" },
}, { timestamps: true });

export default mongoose.model("NGO", ngoSchema);

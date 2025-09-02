import mongoose from "mongoose";

const ddmoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  verified: { type: Boolean, default: false },
  role: { type: String, default: "ddmo" },
}, { timestamps: true });

export default mongoose.model("DDMO", ddmoSchema);

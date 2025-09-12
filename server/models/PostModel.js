import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String,
}, { _id: false });

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  files: [fileSchema],
  location: String,
  severityPrediction: { type: String }, // predicted by FastAPI
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Post", postSchema);

import Post from "../models/PostModel.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import fs from "fs"; // Change back to standard fs for createReadStream
import FormData from "form-data"; 

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, location } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    let uploadedFiles = [];
    let severity = "non_disaster"; // default severity
    let firstImageFile = null;

    if (req.files?.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        if (!firstImageFile && file.mimetype.startsWith("image/")) firstImageFile = file;

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "posts",
          resource_type: "auto",
        });

        return {
          name: file.originalname,
          type: file.mimetype.split("/")[0],
          url: result.secure_url,
        };
      });
      uploadedFiles = await Promise.all(uploadPromises);
    }

    // Call FastAPI ML server
    if (firstImageFile) {
      try {
        const formData = new FormData();
        formData.append("post", content);
        const imageStream = fs.createReadStream(firstImageFile.path);
        formData.append("image", imageStream, firstImageFile.originalname);

        const response = await axios.post("https://disaster-classifier-kjj7.onrender.com/predict", formData, {
          headers: formData.getHeaders(),
        });

        severity = response.data.severity;
      } catch (mlErr) {
        console.error("ML API error:", mlErr.message);
      }
    }

    // Clean up multer temp files
    if (req.files) {
      await Promise.all(req.files.map(file => fs.promises.unlink(file.path).catch(() => {})));
    }

    const newPost = new Post({
      content,
      files: uploadedFiles,
      location,
      severityPrediction: severity,
      user: req.user ? req.user.id : null,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(500).json({ error: "Server error while creating post" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "name email");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

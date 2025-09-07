import Post from "../models/PostModel.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import fs from "fs/promises"; // Use fs.promises for async file operations
import FormData from "form-data"; 
import path from 'path';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, location } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    let uploadedFiles = [];
    let severityPrediction = false; // Default value
    let disasterName = "unknown"; // Default value
    
    // Use a variable to store the local path of the first image file
    let firstImagePath = null;

    // First, upload to Cloudinary to get URLs
    if (req.files?.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        // Store the path of the first image for the ML prediction step
        if (!firstImagePath && file.mimetype.startsWith('image/')) {
            firstImagePath = file.path;
        }

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
    
    // Call FastAPI ML model for prediction using the first image and the text
    if (firstImagePath) {
        try {
            const formData = new FormData();
            
            // Read the file into a buffer before appending
            const imageBuffer = await fs.readFile(firstImagePath);
            formData.append("image", imageBuffer, path.basename(firstImagePath));
            formData.append("text", content);

            // Use the correct port (4000) from the FastAPI app
            const response = await axios.post("http://localhost:4000/predict", formData, {
                headers: formData.getHeaders(),
            });

            // Correctly map the prediction data to your schema fields
            const { predicted_damage, predicted_disaster } = response.data;
            severityPrediction = (predicted_damage === 'high' || predicted_damage === 'medium');
            disasterName = predicted_disaster;

        } catch (mlErr) {
            console.error("ML API error:", mlErr.message);
            // prediction remains the fallback value
        }
    }

    // After prediction, clean up the multer files
    if (req.files) {
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
    }
    
    const newPost = new Post({
      content,
      files: uploadedFiles,
      location,
      severityPrediction,
      disasterName,
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
    const posts = await Post.find().sort({ createdAt: -1 }); // latest first
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Get single post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "name email");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

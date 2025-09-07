import Post from "../models/PostModel.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import fs from "fs/promises"; 
import FormData from "form-data"; 
import path from 'path';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, location } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    let uploadedFiles = [];
    let severityPrediction = false; 
    let disasterName = "unknown"; 
    
    let firstImagePath = null;

    if (req.files?.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
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

            const { predicted_damage, predicted_disaster } = response.data;
            severityPrediction = (predicted_damage === 'high' || predicted_damage === 'medium');
            disasterName = predicted_disaster;

        } catch (mlErr) {
            console.error("ML API error:", mlErr.message);
        }
    }

    // After prediction, clean up the multer files
    if (req.files) {
        const cleanupPromises = req.files.map(async (file) => {
            try {
                await fs.unlink(file.path);
            } catch (cleanupErr) {
                console.error(`Failed to delete file at ${file.path}:`, cleanupErr);
            }
        });
        await Promise.all(cleanupPromises);
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

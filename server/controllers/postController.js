import Post from "../models/PostModel.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, location } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    let uploadedFiles = [];
    let severityPrediction = "non_disaster"; // Default string value to match your existing data
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
          timeout: 10000 // 10 second timeout
        });

        severityPrediction = response.data.severity || "non_disaster";
        console.log('ML API Response:', { severityPrediction });
      } catch (mlErr) {
        console.error("ML API error:", mlErr.message);
        // If ML fails, check content for disaster keywords
        const disasterKeywords = ['flood', 'fire', 'earthquake', 'storm', 'hurricane', 'tsunami', 'cyclone', 'emergency', 'help', 'rescue', 'disaster', 'urgent', 'danger', 'crisis'];
        const hasDisasterKeyword = disasterKeywords.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        );
        severityPrediction = hasDisasterKeyword ? "disaster" : "non_disaster";
      }
    } else {
      // No image - analyze text content for disaster keywords
      const disasterKeywords = ['flood', 'fire', 'earthquake', 'storm', 'hurricane', 'tsunami', 'cyclone', 'emergency', 'help', 'rescue', 'disaster', 'urgent', 'danger', 'crisis'];
      const hasDisasterKeyword = disasterKeywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      severityPrediction = hasDisasterKeyword ? "disaster" : "non_disaster";
    }

    // Clean up multer temp files
    if (req.files) {
      await Promise.all(req.files.map(file => fs.promises.unlink(file.path).catch(() => {})));
    }

    const newPost = new Post({
      content,
      files: uploadedFiles,
      location, // Keep as string format: "lat, lng"
      severityPrediction, // Keep as string to match your existing data
      user: req.user ? req.user.id : null,
    });

    await newPost.save();

    // Populate user data for response
    const populatedPost = await Post.findById(newPost._id).populate("user", "name email");

    // Get Socket.IO instance and emit new post
    const io = req.app.get("io");
    if (io) {
      io.emit("newPost", populatedPost);
      console.log('Emitted newPost event for:', populatedPost._id);
    }

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(500).json({ error: "Server error while creating post" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    console.log(`Returning ${posts.length} posts`);
    // Log first few posts for debugging
    if (posts.length > 0) {
      console.log('Sample posts:', posts.slice(0, 3).map(p => ({
        id: p._id,
        location: p.location,
        severityPrediction: p.severityPrediction,
        content: p.content?.substring(0, 50) + '...'
      })));
    }
    
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
    
    // Emit post deletion event
    const io = req.app.get("io");
    if (io) {
      io.emit("postDeleted", req.params.id);
    }
    
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
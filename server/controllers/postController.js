import Post from "../models/PostModel.js";
import cloudinary from "../config/cloudinary.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, location } = req.body;

    // Validate content
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    let uploadedFiles = [];

    // Handle file uploads (if any)
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "posts",
        });

        return {
          name: file.originalname,
          type: file.mimetype.split("/")[0], // image, video, etc.
          url: result.secure_url,
        };
      });

      uploadedFiles = await Promise.all(uploadPromises);
    }

    // Create post
    const newPost = new Post({
      content,
      files: uploadedFiles,
      location,
      user: req.user ? req.user.id : null,
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(500).json({ error: err.message });
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

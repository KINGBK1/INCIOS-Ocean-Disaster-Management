// Database temporarily disabled for testing
// import Post from "../models/PostModel.js"; 
// import cloudinary from "../config/cloudinary.js"; 
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

// In-memory storage for testing
let posts = [
  {
    _id: "test1",
    content: "Emergency flood situation in Mumbai area! Need immediate help",
    location: "19.0760, 72.8777",
    severityPrediction: "high_risk",
    createdAt: new Date(),
    files: [],
    user: { name: "Test User 1" }
  },
  {
    _id: "test2", 
    content: "Heavy rainfall causing severe waterlogging in Delhi roads",
    location: "28.6139, 77.2090",
    severityPrediction: "mild_risk",
    createdAt: new Date(Date.now() - 3600000),
    files: [],
    user: { name: "Test User 2" }
  },
  {
    _id: "test3", 
    content: "Storm approaching coastal areas, evacuation needed urgently",
    location: "11.0168, 76.9558",
    severityPrediction: "high_risk",
    createdAt: new Date(Date.now() - 7200000),
    files: [],
    user: { name: "Test User 3" }
  },
  {
    _id: "test4", 
    content: "Light rain expected in the area tomorrow",
    location: "22.5726, 88.3639",
    severityPrediction: "low_risk",
    createdAt: new Date(Date.now() - 10800000),
    files: [],
    user: { name: "Test User 4" }
  }
];

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

        // const result = await cloudinary.uploader.upload(file.path, {
        //   folder: "posts",
        //   resource_type: "auto",
        // });

        return {
          name: file.originalname,
          type: file.mimetype.split("/")[0],
          url: "https://via.placeholder.com/400x300?text=Test+Image", // Mock URL for testing
        };
      });
      uploadedFiles = await Promise.all(uploadPromises);
    }

    // Call FastAPI ML server - try with image first, then text-only
    let mlApiAttempted = false;
    
    if (firstImageFile) {
      try {
        console.log("🔍 Attempting ML API call with image:", firstImageFile.originalname);
        const formData = new FormData();
        formData.append("post", content);
        const imageStream = fs.createReadStream(firstImageFile.path);
        formData.append("image", imageStream, firstImageFile.originalname);

        const response = await axios.post("https://disaster-classifier-kjj7.onrender.com/predict", formData, {
          headers: formData.getHeaders(),
          timeout: 30000 // 30 second timeout
        });

        console.log("✅ ML API Response:", response.data);
        severity = response.data.severity;
        console.log("📊 Assigned severity:", severity);
        mlApiAttempted = true;
      } catch (mlErr) {
        console.error("❌ ML API error with image:", mlErr.message);
        console.error("ML API error details:", mlErr.response?.data || mlErr.code);
      }
    }
    
    // If no image or image ML failed, try text-only classification
    if (!mlApiAttempted && content && content.trim().length > 10) {
      try {
        console.log("🔍 Attempting ML API call with text-only:", content.substring(0, 50));
        const formData = new FormData();
        formData.append("post", content);
        // Send a dummy empty image file
        formData.append("image", Buffer.alloc(0), 'empty.jpg');

        const response = await axios.post("https://disaster-classifier-kjj7.onrender.com/predict", formData, {
          headers: formData.getHeaders(),
          timeout: 15000 // 15 second timeout for text-only
        });

        console.log("✅ ML API Text Response:", response.data);
        severity = response.data.severity;
        console.log("📊 Text-based severity:", severity);
        mlApiAttempted = true;
      } catch (textMlErr) {
        console.error("❌ ML API text-only error:", textMlErr.message);
        console.log("⚠️ ML API failed, using intelligent fallback");
      }
    }
    
    // Intelligent fallback when ML API fails
    if (!mlApiAttempted || severity === "non_disaster") {
      console.log("🧠 Using intelligent keyword-based classification...");
      const disasterKeywords = {
        high_risk: ['tsunami', 'cyclone', 'hurricane', 'earthquake', 'flood', 'fire', 'emergency', 'disaster', 'urgent', 'help', 'rescue', 'danger', 'critical'],
        mild_risk: ['storm', 'heavy rain', 'wind', 'warning', 'alert', 'caution', 'damage', 'accident'],
        low_risk: ['weather', 'cloud', 'rain', 'wind', 'update', 'report', 'observation']
      };
      
      const lowerContent = content.toLowerCase();
      for (const [level, keywords] of Object.entries(disasterKeywords)) {
        if (keywords.some(keyword => lowerContent.includes(keyword))) {
          severity = level;
          console.log("✅ Keyword-based classification:", severity, "(matched keywords)");
          break;
        }
      }
      
      // If still non_disaster and has location + meaningful content, classify as low_risk
      if (severity === "non_disaster" && location && content.trim().length > 20) {
        severity = "low_risk";
        console.log("✅ Fallback classification: low_risk (has location and substantial content)");
      }
    }

    // Clean up multer temp files
    if (req.files) {
      await Promise.all(req.files.map(file => fs.promises.unlink(file.path).catch(() => {})));
    }

    console.log("💾 Creating post with severity:", severity);
    
    // For testing, create a simple test post
    const testPost = {
      _id: `test_${Date.now()}`,
      content,
      location,
      severityPrediction: severity,
      createdAt: new Date(),
      files: uploadedFiles
    };
    
    // Add to test posts array
    testPosts.unshift(testPost);
    console.log("✅ Test post created:", testPost);
    
    // Emit the new post to all connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('newPost', testPost);
      console.log("📡 Emitted newPost event to all connected clients");
    }
    
    res.status(201).json(testPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(500).json({ error: "Server error while creating post" });
  }
};

// Temporary in-memory storage for testing
let testPosts = [
  {
    _id: "test1",
    content: "Test flood report in Mumbai area",
    location: "19.0760, 72.8777",
    severityPrediction: "high_risk",
    createdAt: new Date(),
    files: []
  },
  {
    _id: "test2", 
    content: "Heavy rainfall causing waterlogging",
    location: "28.6139, 77.2090",
    severityPrediction: "mild_risk",
    createdAt: new Date(Date.now() - 3600000),
    files: []
  }
];

export const getPosts = async (req, res) => {
  try {
    console.log("💾 Returning test posts:", testPosts.length);
    res.json(testPosts);
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
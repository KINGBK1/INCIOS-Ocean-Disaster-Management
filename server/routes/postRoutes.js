import express from "express";
import { createPost, getPosts, getPostById, deletePost } from "../controllers/postController.js";
import multer from "multer";

const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to create a new post with file uploads
router.post("/", upload.array("files"), createPost);

// Route to get all posts
router.get("/", getPosts);

// Route to get a single post by ID
router.get("/:id", getPostById);

// Route to delete a post
router.delete("/:id", deletePost);

export default router;

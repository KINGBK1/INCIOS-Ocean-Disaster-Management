import express from "express";
import multer from "multer";
import {
  createPost,
  getPosts,
  getPostById,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp storage

router.post("/", upload.array("files"), createPost);  
router.get("/", getPosts);
router.get("/:id", getPostById);
router.delete("/:id", deletePost);

export default router;

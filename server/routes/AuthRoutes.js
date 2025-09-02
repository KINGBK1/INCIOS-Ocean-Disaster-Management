import express from "express";
import { register, login, googleLogin, approveUser } from "../controllers/authController.js";
import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);

// only admin can approve NGO/DDMO/Admin signups
router.patch("/approve/:id", authMiddleware, authorizeRoles("admin"), approveUser);

export default router;

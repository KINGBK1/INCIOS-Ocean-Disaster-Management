import express from "express";
import { register, login, googleLogin, approveUser } from "../controllers/authController.js";
import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/status", authMiddleware, (req, res) => {
  res.json({ message: "Authenticated", user: req.user });
}) ; 

// only admin can approve NGO/DDMO/Admin signups
router.patch("/approve/:id", authMiddleware, authorizeRoles("admin"), approveUser);


// miscellaneous routes
//For Pinging the server after every 5 mins
router.get("/ping", (req, res) => {
  res.json({ message: "Pong" });
});

export default router;

// routes/mapRoutes.js
import express from "express";
import { getDisasters,addDisaster,getZones } from "../controllers/mapController.js";

const router = express.Router();

// GET all disasters
router.get("/", getDisasters);

// POST a new disaster
router.post("/", addDisaster);
router.get("/zones", getZones);

export default router;

import express from "express";
import { fetchHWAData } from "../services/incoisScraper.js";

const router = express.Router();

router.get("/hwa", async (req, res) => {
  try {
    const threats = await fetchHWAData();
    res.json({ success: true, threats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

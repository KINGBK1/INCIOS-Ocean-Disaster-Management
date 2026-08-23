import express from "express";
import { getAlerts , getPast90DaysAlerts,getCoastlineAlerts } from "../controllers/alertsController.js";

const router = express.Router();

// GET /api/alerts
router.get("/", getAlerts);

// GET /api/past90daysalerts
router.get("/past90daysalerts", getPast90DaysAlerts);

router.get("/coastline-alerts", getCoastlineAlerts);

export default router;

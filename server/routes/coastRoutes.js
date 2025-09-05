import express from "express";
import axios from "axios";

const router = express.Router();

// Example: fetch significant wave height data from INCOIS ERDDAP
router.get("/threats", async (req, res) => {
  try {
    // 🔹 Replace datasetID with the actual dataset you want from ERDDAP
    const datasetID = "ww3_indian_ocean"; // Example placeholder
    const variables = "time,latitude,longitude,significant_wave_height";

    // ERDDAP query in CSV format
    const erddapURL = `https://erddap.incois.gov.in/erddap/tabledap/${datasetID}.csv?${variables}&orderBy("time")&limit=50`;

    const response = await axios.get(erddapURL);

    // Right now it's CSV, you can send directly or parse to JSON
    res.type("text/csv").send(response.data);
  } catch (err) {
    console.error("ERDDAP fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch coastline threats" });
  }
});

export default router;

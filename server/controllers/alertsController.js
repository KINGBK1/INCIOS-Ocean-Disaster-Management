import axios from "axios"

// Call FastAPI backend
const FASTAPI_URL = "http://localhost:8000/alerts";

export const getAlerts = async (req, res) => {
  try {
    const response = await axios.get(FASTAPI_URL);
    const alerts = response.data.alerts; 
    res.status(200).json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error.message);
    res.status(500).json({ error: "Failed to fetch alerts from backend" });
  }
};

export const getPast90DaysAlerts = async (req, res) => {
  try {
 
    const response = await axios.get("http://localhost:8000/past90daysalerts"); // getting the scraped past 90 days alert json data from fastapi server

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching past 90 days alerts:", error.message);
    res.status(500).json({ error: "Failed to fetch past 90 days alerts" });
  }
};


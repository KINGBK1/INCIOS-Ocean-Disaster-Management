import axios from "axios";
import { MongoClient } from "mongodb";
import cron from "node-cron";

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("INCIOS_DMS");
const alertsCollection = db.collection("coastline_alerts");

const FASTAPI_URL = "https://web-scraping-server-rdgi.onrender.com/alerts";

// Schedule ping to FastAPI every 6 hours (0 */6 * * *)
cron.schedule("0 */6 * * *", async () => {
  try {
    await client.connect();
    const response = await axios.get(FASTAPI_URL);
    const alerts = response.data.alerts;

    for (let alert of alerts) {
      alert.fetched_at = new Date();
      const { lat, lng } = await geocodeLocation(alert.District || alert.STATE);
      if (lat && lng) {
        alert.lat = lat;
        alert.lng = lng;
      }
    }

    if (alerts.length > 0) {
      await alertsCollection.deleteMany({});
      await alertsCollection.insertMany(alerts);
      console.log(`Updated ${alerts.length} coastline alerts at ${new Date()}`);
    }
  } catch (error) {
    console.error("Error updating coastline alerts:", error.message);
  } finally {
    await client.close();
  }
});

async function geocodeLocation(placeName) {
  if (!placeName) return { lat: null, lng: null };
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: placeName, format: "json", limit: 1 },
      headers: { "User-Agent": "INCIOS-App" },
    });
    const data = response.data[0];
    return { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
  } catch (error) {
    console.error(`Geocoding failed for ${placeName}:`, error.message);
    return { lat: null, lng: null };
  }
}

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
    const response = await axios.get("https://web-scraping-server-rdgi.onrender.com/past90daysalerts");
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching past 90 days alerts:", error.message);
    res.status(500).json({ error: "Failed to fetch past 90 days alerts" });
  }
};

export const getCoastlineAlerts = async (req, res) => {
  try {
    await client.connect();
    const { limit = 100, alertType, state, district } = req.query;

    let filter = {};
    if (alertType) filter.Alert = { $regex: alertType, $options: "i" };
    if (state) filter.STATE = { $regex: state, $options: "i" };
    if (district) filter.District = { $regex: district, $options: "i" };
    filter.lat = { $exists: true, $ne: null };
    filter.lng = { $exists: true, $ne: null };

    const alerts = await alertsCollection
      .find(filter)
      .sort({ fetched_at: -1 })
      .limit(parseInt(limit))
      .toArray();

    const coastlineData = alerts.map(alert => ({
      lat: alert.lat,
      lng: alert.lng,
      radius: getRadiusByAlertType(alert.Alert),
      type: "coastline",
      alertType: alert.Alert || "UNKNOWN",
      color: alert.Color || "Blue",
      state: alert.STATE,
      district: alert.District,
      message: alert.Message,
      issueDate: alert["Issue Date"],
      objectId: alert.OBJECTID,
      popupContent: {
        title: alert.Alert || "Coastline Alert",
        details: [
          { label: "State", value: alert.STATE },
          { label: "District", value: alert.District },
          { label: "Message", value: alert.Message },
          { label: "Issue Date", value: alert["Issue Date"] },
          { label: "Color Code", value: alert.Color },
        ],
      },
    }));

    res.status(200).json({
      success: true,
      count: coastlineData.length,
      coastlineAlerts: coastlineData,
    });
  } catch (error) {
    console.error("Error fetching coastline alerts:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch coastline alerts from database",
    });
  } finally {
    await client.close();
  }
};

function getRadiusByAlertType(alertType) {
  if (!alertType) return 5000;
  const type = alertType.toUpperCase();
  if (type.includes("HIGH WAVE")) return 15000;
  if (type.includes("STORM SURGE")) return 20000;
  if (type.includes("TSUNAMI")) return 50000;
  if (type.includes("CYCLONE")) return 100000;
  return 8000;
}
import axios from "axios";
import { MongoClient } from "mongodb";
import cron from "node-cron";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("VARUNA_DMS");
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
      headers: { "User-Agent": "VARUNA-App" },
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
    const response = await axios.get(FASTAPI_URL, {
      timeout: 5000 // 5 second timeout
    });
    const alerts = response.data.alerts || response.data;
    if (alerts && Array.isArray(alerts)) {
      res.status(200).json({ alerts });
      return;
    }
  } catch (error) {
    console.warn("External API unavailable for alerts, using mock data:", error.message);
  }
  
  // Fallback to mock data
  const mockAlerts = [
    {
      id: "current-1",
      Alert: "HIGH WAVE ALERT",
      STATE: "Tamil Nadu",
      District: "Chennai",
      Message: "Current high wave conditions along Chennai coast. Fishermen advised to stay ashore.",
      "Issue Date": new Date().toISOString().split('T')[0],
      Color: "Orange",
      OBJECTID: "TN_CURRENT_001",
      fetched_at: new Date()
    },
    {
      id: "current-2",
      Alert: "STORM WATCH",
      STATE: "Kerala",
      District: "Kochi",
      Message: "Storm conditions developing. Monitor weather updates closely.",
      "Issue Date": new Date().toISOString().split('T')[0],
      Color: "Yellow",
      OBJECTID: "KL_CURRENT_001",
      fetched_at: new Date()
    }
  ];
  
  console.log(`Returning ${mockAlerts.length} current mock alerts`);
  res.status(200).json({ alerts: mockAlerts });
};

export const getPast90DaysAlerts = async (req, res) => {
  try {
    // Try to fetch from external API first
    const response = await axios.get("https://web-scraping-server-rdgi.onrender.com/past90daysalerts", {
      timeout: 5000 // 5 second timeout
    });
    
    if (response.data && Array.isArray(response.data)) {
      res.json(response.data);
      return;
    }
  } catch (error) {
    console.warn("External API unavailable, using mock data:", error.message);
  }
  
  // Fallback to mock data
  const mockAlerts = [
    {
      id: "mock-1",
      Alert: "HIGH WAVE ALERT",
      STATE: "Tamil Nadu",
      District: "Chennai",
      Message: "High waves expected along the coast. Fishermen are advised not to venture into the sea.",
      "Issue Date": "2024-01-15",
      Color: "Orange",
      OBJECTID: "TN001",
      severity: "medium",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      location: "Chennai, Tamil Nadu"
    },
    {
      id: "mock-2",
      Alert: "STORM SURGE WARNING",
      STATE: "Odisha",
      District: "Puri",
      Message: "Storm surge conditions expected. Coastal areas to be evacuated immediately.",
      "Issue Date": "2024-01-10",
      Color: "Red",
      OBJECTID: "OD001",
      severity: "high",
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
      location: "Puri, Odisha"
    },
    {
      id: "mock-3",
      Alert: "TSUNAMI WATCH",
      STATE: "Kerala",
      District: "Thiruvananthapuram",
      Message: "Tsunami watch issued for coastal areas. Stay alert and follow official instructions.",
      "Issue Date": "2024-01-05",
      Color: "Red",
      OBJECTID: "KL001",
      severity: "high",
      timestamp: new Date(Date.now() - 86400000 * 12).toISOString(), // 12 days ago
      location: "Thiruvananthapuram, Kerala"
    },
    {
      id: "mock-4",
      Alert: "CYCLONE WARNING",
      STATE: "Andhra Pradesh",
      District: "Visakhapatnam",
      Message: "Cyclone formation detected. Prepare for severe weather conditions.",
      "Issue Date": "2024-01-01",
      Color: "Red",
      OBJECTID: "AP001",
      severity: "high",
      timestamp: new Date(Date.now() - 86400000 * 20).toISOString(), // 20 days ago
      location: "Visakhapatnam, Andhra Pradesh"
    },
    {
      id: "mock-5",
      Alert: "LOW WAVE ADVISORY",
      STATE: "Gujarat",
      District: "Bhavnagar",
      Message: "Moderate wave conditions. Normal fishing activities can continue with caution.",
      "Issue Date": "2023-12-28",
      Color: "Yellow",
      OBJECTID: "GJ001",
      severity: "low",
      timestamp: new Date(Date.now() - 86400000 * 25).toISOString(), // 25 days ago
      location: "Bhavnagar, Gujarat"
    },
    {
      id: "mock-6",
      Alert: "COASTAL FLOODING ALERT",
      STATE: "West Bengal",
      District: "South 24 Parganas",
      Message: "High tide conditions may cause coastal flooding. Residents advised to move to higher ground.",
      "Issue Date": "2023-12-25",
      Color: "Orange",
      OBJECTID: "WB001",
      severity: "medium",
      timestamp: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
      location: "South 24 Parganas, West Bengal"
    }
  ];
  
  console.log(`Returning ${mockAlerts.length} mock alerts for past 90 days`);
  res.json(mockAlerts);
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
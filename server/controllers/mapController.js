

// Dummy disaster data (replace with DB or AI output later)
const disasterData = [
  { id: 1, type: "Flood", lat: 26.9124, lon: 75.7873, desc: "Severe flooding in Jaipur" },
  { id: 2, type: "Earthquake", lat: 28.7041, lon: 77.1025, desc: "5.5 magnitude quake in Delhi" },
  { id: 3, type: "Cyclone", lat: 19.0760, lon: 72.8777, desc: "Cyclone near Mumbai coast" }
];

// @desc    Get all disaster locations
// @route   GET /api/disasters
export const getDisasters = (req, res) => {
  try {
    res.json(disasterData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching disasters", error: err.message });
  }
};

// (Optional) Add new disaster location
// @route   POST /api/disasters
export const addDisaster = (req, res) => {
  try {
    const { type, lat, lon, desc } = req.body;
    if (!type || !lat || !lon) {
      return res.status(400).json({ message: "Type, lat, and lon are required" });
    }
    const newDisaster = {
      id: disasterData.length + 1,
      type,
      lat,
      lon,
      desc: desc || "No description"
    };
    disasterData.push(newDisaster);
    res.status(201).json(newDisaster);
  } catch (err) {
    res.status(500).json({ message: "Error adding disaster", error: err.message });
  }
};

export const getZones = async (req, res) => {
  try {
    const zones = [
      { lat: 20.5937, lng: 78.9629, type: "danger", radius: 50000 },
      { lat: 19.076, lng: 72.8777, type: "warning", radius: 40000 },
      { lat: 28.6139, lng: 77.209, type: "safe", radius: 30000 }
    ];
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zones" });
  }
};

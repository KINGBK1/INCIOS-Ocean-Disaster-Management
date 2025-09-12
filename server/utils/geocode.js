import axios from "axios";

export const reverseGeocode = async (lat, lon) => {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { format: "json", lat, lon },
      headers: { "User-Agent": "VARUNA/1.0 (your-email@example.com)" }, // Nominatim requires this
    });

    const data = res.data;
    return [
      data?.address?.city || data?.address?.town || data?.address?.village,
      data?.address?.state,
    ]
      .filter(Boolean)
      .join(", ");
  } catch (err) {
    console.error("Reverse geocoding failed:", err.message);
    return null;
  }
};
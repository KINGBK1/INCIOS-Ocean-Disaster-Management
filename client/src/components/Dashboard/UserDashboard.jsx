import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import { Image, Video, Mic, MapPin, Send, X } from "lucide-react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./UserDashboard.css";
import Cookies from "js-cookie";
import UserDashboardNavbar from "./Navbar/UserDashboardNav";
import { CircleMarker } from "react-leaflet";

// Fix default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icon for user location
const userLocationIcon = L.divIcon({
  className: "custom-user-location-marker",
  html: `<div style="
    width: 20px; 
    height: 20px; 
    background: #007bff; 
    border: 3px solid white; 
    border-radius: 50%; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    position: relative;
  ">
    <div style="
      position: absolute;
      top: -5px;
      left: -5px;
      width: 30px;
      height: 30px;
      background: rgba(0, 123, 255, 0.2);
      border-radius: 50%;
      animation: pulse 2s infinite;
    "></div>
  </div>
  <style>
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const UserDashboard = () => {
  const [zones, setZones] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [location, setLocation] = useState("");
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState(5);
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coastlineAlerts, setCoastlineAlerts] = useState([]);

  const mapRef = useRef(null);
  const navigate = useNavigate();

  // ------------------ Helpers for severity zones ------------------
  const parseLatLngFromLocation = (locationStr) => {
    if (!locationStr || typeof locationStr !== "string") return null;
    const numRegex = /-?\d+(?:\.\d+)?/g;
    const matches = locationStr.match(numRegex);
    if (!matches || matches.length < 2) return null;
    const lng = parseFloat(matches[matches.length - 1]);
    const lat = parseFloat(matches[matches.length - 2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  };

  const buildSeverityZones = (
    postsArray,
    precision = 2,
    dangerThreshold = 2
  ) => {
    const buckets = {};
    postsArray.forEach((p) => {
      const coords = parseLatLngFromLocation(p.location);
      if (!coords) return;
      const keyLat = Number(coords.lat.toFixed(precision));
      const keyLng = Number(coords.lng.toFixed(precision));
      const key = `${keyLat},${keyLng}`;
      if (!buckets[key]) {
        buckets[key] = { lat: keyLat, lng: keyLng, count: 0, severeCount: 0 };
      }
      buckets[key].count += 1;
      if (p.severityPrediction) buckets[key].severeCount += 1;
    });

    return Object.values(buckets).map((b) => {
      const radiusBase = 500; // meters
      const maxRadius = 500000;
      const radius = Math.min(
        Math.round(radiusBase * Math.sqrt(b.count)),
        maxRadius
      );
      let type = "safe";
      if (b.severeCount >= dangerThreshold) type = "danger";
      else if (b.severeCount > 0) type = "warning";
      else type = "safe";
      return {
        lat: b.lat,
        lng: b.lng,
        radius,
        type,
        label: `Reports: ${b.count}${
          b.severeCount ? ` • Severe: ${b.severeCount}` : ""
        }`,
      };
    });
  };

  // NEW: Fetch coastline alerts from MongoDB
  const fetchCoastlineAlerts = async () => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/alerts/coastline-alerts?limit=100`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.coastlineAlerts) {
        const alertZones = data.coastlineAlerts.map(alert => ({
          lat: alert.lat,
          lng: alert.lng,
          radius: alert.radius,
          type: 'coastline',
          alertType: alert.alertType,
          color: alert.color,
          state: alert.state,
          district: alert.district,
          message: alert.message,
          issueDate: alert.issueDate,
          objectId: alert.objectId,
          popupContent: alert.popupContent
        }));
        
        setCoastlineAlerts(alertZones);
        console.log(`Loaded ${alertZones.length} coastline alerts`);
      }
    } catch (err) {
      console.error("Error fetching coastline alerts:", err);
    }
  };

  // Get coastline alert style based on alert type and color
  const getCoastlineStyle = (alert) => {
    const baseStyle = { fillOpacity: 0.4, weight: 2 };
    
    // Use color from alert data
    if (alert.color) {
      const colorMap = {
        'Yellow': '#FFD700',
        'Orange': '#FFA500', 
        'Red': '#FF0000',
        'Green': '#008000',
        'Blue': '#0000FF'
      };
      
      const color = colorMap[alert.color] || '#0000FF';
      return { ...baseStyle, color, fillColor: color };
    }
    
    // Fallback to alert type
    switch (alert.alertType?.toUpperCase()) {
      case 'HIGH WAVE WATCH':
        return { ...baseStyle, color: '#FFA500', fillColor: '#FFA500' };
      case 'STORM SURGE WATCH':
        return { ...baseStyle, color: '#FF0000', fillColor: '#FF0000' };
      default:
        return { ...baseStyle, color: '#0000FF', fillColor: '#0000FF' };
    }
  };
  // ---------------------------------------------------------------

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("No token found");
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/status`,
          {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/signin");
      }
    };

    const fetchZones = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/disasters/zones`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        const data = await res.json();
        setZones(data);
      } catch (err) {
        console.error("Error fetching zones:", err);
      }
    };

    const fetchPosts = async () => {
      try {
        const apiUrl =
          "https://incios-ocean-disaster-management.onrender.com/api/posts";
        const res = await fetch(apiUrl, { 
          method: 'GET',
          credentials: 'include' 
        });
        const data = await res.json();
        const postsFromApi = Array.isArray(data) ? data : [];
        setPosts(postsFromApi);
        const computedZones = buildSeverityZones(postsFromApi, 2, 2);
        setZones((prev) => {
          const kept = prev ? prev.filter((z) => z.type === "coastline") : [];
          return [...kept, ...computedZones];
        });
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchUser();
    fetchZones();
    fetchPosts();
    fetchCoastlineAlerts(); // NEW: Fetch coastline alerts

    const backendURL =
      import.meta.env.MODE === "production"
        ? import.meta.env.VITE_BACKEND_PROD_URL
        : import.meta.env.VITE_BACKEND_URL;

    const socket = io(backendURL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socket.on("newPost", (newPost) => setPosts((prev) => [newPost, ...prev]));
    socket.on("zoneUpdate", (updatedZones) => setZones(updatedZones));
    getUserLocation();

    return () => socket.disconnect();
  }, [navigate]);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      const map = mapRef.current;
      map.flyTo([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported.");
      return;
    }
    setIsGettingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let msg = "Error getting location.";
        if (error.code === error.PERMISSION_DENIED) msg = "Location denied.";
        if (error.code === error.POSITION_UNAVAILABLE)
          msg = "Location unavailable.";
        if (error.code === error.TIMEOUT) msg = "Location timed out.";
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const getZoneStyle = (type) => {
    switch (type) {
      case "danger":
        return { color: "red", fillColor: "red", fillOpacity: 0.3 };
      case "warning":
        return { color: "yellow", fillColor: "yellow", fillOpacity: 0.3 };
      case "safe":
        return { color: "green", fillColor: "green", fillOpacity: 0.3 };
      case "coastline":
        return { color: "blue", fillColor: "blue", fillOpacity: 0.3 };
      default:
        return { color: "gray", fillColor: "gray", fillOpacity: 0.2 };
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const fileObjects = files.map((file) => ({
      file,
      type: file.type.split("/")[0],
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setSelectedFiles([...selectedFiles, ...fileObjects]);
  };

  const removeFile = (index) =>
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));

  const handlePost = async () => {
    if (!postContent.trim() && selectedFiles.length === 0) return;
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("location", location);
      if (userLocation) {
        formData.append("coordinates", JSON.stringify(userLocation));
      }
      selectedFiles.forEach((f) => formData.append("files", f.file));
      
      const token = Cookies.get("token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          credentials: 'include',
        }
      );
      
      if (response.ok) {
        setPostContent("");
        setSelectedFiles([]);
        setLocation("");
      }
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setIsPosting(false);
    }
  };

  // Combine all zones for display
  const allZones = [...zones, ...coastlineAlerts];

  return (
    <div className="dashboard-container">
      <nav>
        <UserDashboardNavbar user={user} />
      </nav>
      <div className="main-content">
        <div className="content-grid">
          <div className="map-section">
            <div className="map-container">
              <div className="section-header">
                <h2 className="section-title">
                  🌍 Live Disaster & Coastline Alert Zones
                </h2>
                {locationError && (
                  <div className="location-error">
                    <small>{locationError}</small>
                  </div>
                )}
                {/* NEW: Alert Statistics */}
                <div className="alert-stats">
                  <span className="stat-item">
                    📊 Coastline Alerts: <strong>{coastlineAlerts.length}</strong>
                  </span>
                  <span className="stat-item">
                    🚨 Danger Zones: <strong>{zones.filter(z => z.type === 'danger').length}</strong>
                  </span>
                  <span className="stat-item">
                    ⚠️ Warning Zones: <strong>{zones.filter(z => z.type === 'warning').length}</strong>
                  </span>
                </div>
              </div>
              <div className="map-wrapper">
                <MapContainer
                  ref={mapRef}
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                  />
                  
                  {/* Render severity zones */}
                  {zones.map((zone, index) => (
                    <Circle
                      key={`severity-zone-${index}`}
                      center={[zone.lat, zone.lng]}
                      radius={zone.radius}
                      pathOptions={getZoneStyle(zone.type)}
                    >
                      <Popup>
                        <div>
                          {zone.type === "danger" && "🚨 Danger Zone"}
                          {zone.type === "warning" && "⚠️ Warning Zone"}
                          {zone.type === "safe" && "✅ Safe Zone"}
                          {zone.label && <div>{zone.label}</div>}
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                  
                  {/* NEW: Render coastline alerts */}
                  {coastlineAlerts.map((alert, index) => (
                    <Circle
                      key={`coastline-alert-${index}`}
                      center={[alert.lat, alert.lng]}
                      radius={alert.radius}
                      pathOptions={getCoastlineStyle(alert)}
                    >
                      <Popup>
                        <div className="coastline-popup">
                          <h4 style={{ color: '#1e40af', marginBottom: '8px', fontSize: '16px' }}>
                            🌊 {alert.alertType || 'Coastline Alert'}
                          </h4>
                          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                            <p><strong>State:</strong> {alert.state || 'N/A'}</p>
                            <p><strong>District:</strong> {alert.district || 'N/A'}</p>
                            <p><strong>Message:</strong> {alert.message || 'No message'}</p>
                            <p><strong>Issue Date:</strong> {alert.issueDate || 'N/A'}</p>
                            <p><strong>Color Code:</strong> 
                              <span style={{ 
                                backgroundColor: alert.color === 'Yellow' ? '#FFD700' : 
                                                alert.color === 'Orange' ? '#FFA500' :
                                                alert.color === 'Red' ? '#FF0000' : 
                                                alert.color === 'Green' ? '#008000' : '#0000FF',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                marginLeft: '4px',
                                fontSize: '12px'
                              }}>
                                {alert.color || 'Blue'}
                              </span>
                            </p>
                            {alert.objectId && <p><strong>ID:</strong> {alert.objectId}</p>}
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                  
                  {/* User location */}
                  {userLocation && (
                    <>
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userLocationIcon}
                      >
                        <Popup>
                          <div>
                            <h4>📍 Your Location</h4>
                            <p>
                              {userLocation.lat.toFixed(6)},{" "}
                              {userLocation.lng.toFixed(6)}
                            </p>
                            <p>±{Math.round(userLocation.accuracy)}m</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={userLocation.accuracy}
                        pathOptions={{
                          color: "#007bff",
                          fillOpacity: 0.1,
                          dashArray: "5,5",
                        }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
              
              {/* NEW: Enhanced Legend */}
              <div className="map-legend">
                <div className="legend-title">Map Legend:</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#ff0000' }}></div>
                    <span>Danger Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#ffff00' }}></div>
                    <span>Warning Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#00ff00' }}></div>
                    <span>Safe Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#0000ff' }}></div>
                    <span>Coastline Alert</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color user-marker"></div>
                    <span>Your Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="social-section">
            <div className="create-post-container">
              <div className="section-header">
                <h2 className="section-title">📢 Report Disaster</h2>
                <p className="section-subtitle">
                  Share updates, images, and location
                </p>
              </div>
              <div className="post-form">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening?"
                  className="post-textarea"
                  rows="4"
                />
                {selectedFiles.length > 0 && (
                  <div className="file-preview-grid">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="file-preview-item">
                        {f.type === "image" && <img src={f.url} alt={f.name} />}
                        {f.type === "video" && <Video />}
                        {f.type === "audio" && <Mic />}
                        <button onClick={() => removeFile(i)}>
                          <X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {location && (
                  <div className="location-display">
                    <MapPin />
                    <span>{location}</span>
                  </div>
                )}
                <div className="action-buttons">
                  <label className="media-button">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*"
                      onChange={handleFileSelect}
                    />
                    <Image />
                    <span>Media</span>
                  </label>
                  <button onClick={getUserLocation} disabled={isGettingLocation}>
                    <MapPin /> {isGettingLocation ? "Getting..." : "Location"}
                  </button>
                  <button onClick={handlePost} disabled={isPosting}>
                    <Send /> {isPosting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
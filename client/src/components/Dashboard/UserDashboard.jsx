import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import { Image, Video, Mic, MapPin, Send, X, Navigation } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "./UserDashboard.css";
import Cookies from "js-cookie";
// Removed unused imports like Camera, api
import UserDashboardNavbar from "./Navbar/UserDashboardNav";

// Fix default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for user location
const userLocationIcon = L.divIcon({
  className: 'custom-user-location-marker',
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
  iconAnchor: [10, 10]
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
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India center
  const [mapZoom, setMapZoom] = useState(5); // Start with a wider view of India
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const mapRef = useRef(null);
  const navigate = useNavigate();

  // Main effect for fetching data and setting up sockets
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("No token found");

        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/signin");
      }
    };

    const fetchZones = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/disasters/zones`
        );
        setZones(res.data);
      } catch (err) {
        console.error("Error fetching zones:", err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/posts`
        );
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchUser();
    fetchZones();
    fetchPosts();

    const backendURL =
      import.meta.env.MODE === "production"
        ? import.meta.env.VITE_BACKEND_PROD_URL
        : import.meta.env.VITE_BACKEND_URL;

    const socket = io(backendURL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("newPost", (newPost) => setPosts((prev) => [newPost, ...prev]));
    socket.on("zoneUpdate", (updatedZones) => setZones(updatedZones));

    // **MODIFIED: Automatically get user location on component mount**
    getUserLocation();

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // **NEW: Effect to programmatically update the map's view when user location changes**
  useEffect(() => {
    if (mapRef.current && userLocation) {
      const map = mapRef.current;
      // Smoothly fly to the user's location with a close zoom level
      
      map.flyTo([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]); // This effect runs whenever the userLocation state is updated

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { lat: latitude, lng: longitude, accuracy: accuracy };

        // **MODIFIED: This state update now triggers the new useEffect to move the map**
        setUserLocation(newLocation);
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        setIsGettingLocation(false);
        console.log("User location found:", newLocation);
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "";
        switch(error.code) {
          case error.PERMISSION_DENIED: errorMessage = "Location access denied."; break;
          case error.POSITION_UNAVAILABLE: errorMessage = "Location unavailable."; break;
          case error.TIMEOUT: errorMessage = "Location request timed out."; break;
          default: errorMessage = "Error getting location."; break;
        }
        setLocationError(errorMessage);
        console.error("Error getting location:", error);
      },
      options
    );
  };

  const getZoneStyle = (type) => {
    switch (type) {
      case "danger": return { color: "red", fillColor: "red", fillOpacity: 0.3 };
      case "warning": return { color: "yellow", fillColor: "yellow", fillOpacity: 0.3 };
      case "safe": return { color: "green", fillColor: "green", fillOpacity: 0.3 };
      case "coastline": return { color: "blue", fillColor: "blue", fillOpacity: 0.3 };
      default: return { color: "gray", fillColor: "gray", fillOpacity: 0.2 };
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

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const handlePost = async () => {
    if (!postContent.trim() && selectedFiles.length === 0) return;
    setIsPosting(true);

    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("location", location);

      if (userLocation) {
        formData.append("coordinates", JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
          accuracy: userLocation.accuracy
        }));
      }

      selectedFiles.forEach((f) => formData.append("files", f.file));

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setPostContent("");
      setSelectedFiles([]);
      setLocation("");
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setIsPosting(false);
    }
  };
  
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
                <h2 className="section-title">🌍 Live Disaster & Coastline Threats</h2>
                <div className="location-controls">
                  {/* <button
                    onClick={getUserLocation}
                    disabled={isGettingLocation}
                    className="location-button-map"
                    title="Center map on my location"
                  >
                    {isGettingLocation ? <div className="loading-spinner-small" /> : <Navigation className="button-icon" />}
                    {isGettingLocation ? "Getting..." : "My Location"}
                  </button> */}
                  {locationError && <div className="location-error"><small>{locationError}</small></div>}
                </div>
              </div>
              <div className="map-wrapper">
                <MapContainer 
                  ref={mapRef}
                  center={mapCenter} // Sets the initial view before location is found
                  zoom={mapZoom}     // Sets the initial zoom
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                  />
                  
                  {zones.map((zone, index) => (
                    <Circle key={index} center={[zone.lat, zone.lng]} radius={zone.radius} pathOptions={getZoneStyle(zone.type)}>
                      <Popup>
                        {zone.type === "danger" && "🚨 Danger Prone Zone"}
                        {zone.type === "warning" && "⚠️ Warning Zone"}
                        {zone.type === "safe" && "✅ Safe Zone"}
                        {zone.type === "coastline" && `🌊 Coastline Threat: ${zone.label}`}
                      </Popup>
                    </Circle>
                  ))}
                  
                  {userLocation && (
                    <>
                      <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                        <Popup>
                          <div className="user-location-popup">
                            <h4>📍 Your Location</h4>
                            <p><strong>Coordinates:</strong> {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
                            <p><strong>Accuracy:</strong> ±{Math.round(userLocation.accuracy)}m</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={userLocation.accuracy}
                        pathOptions={{ color: '#007bff', fillColor: '#007bff', fillOpacity: 0.1, weight: 1, dashArray: '5,5' }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="social-section">
            <div className="create-post-container">
              <div className="section-header">
                <h2 className="section-title">📢 Report Disaster</h2>
                <p className="section-subtitle">Share updates, images, and location</p>
              </div>

              <div className="post-form">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening? Describe the situation..."
                  className="post-textarea"
                  rows="4"
                />

                {selectedFiles.length > 0 && (
                  <div className="file-preview-section">
                    <p className="file-preview-title">Attached files:</p>
                    <div className="file-preview-grid">
                      {selectedFiles.map((fileObj, index) => (
                        <div key={index} className="file-preview-item">
                          {fileObj.type === "image" && <img src={fileObj.url} alt={fileObj.name} className="preview-image" />}
                          {fileObj.type === "video" && <div className="preview-placeholder"><Video className="placeholder-icon" /></div>}
                          {fileObj.type === "audio" && <div className="preview-placeholder"><Mic className="placeholder-icon" /></div>}
                          <button onClick={() => removeFile(index)} className="remove-file-btn"><X className="remove-icon" /></button>
                          <p className="file-name">{fileObj.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {location && (
                  <div className="location-display">
                    <MapPin className="location-icon" />
                    <span>{location}</span>
                    {userLocation && <small className="location-accuracy">(±{Math.round(userLocation.accuracy)}m accuracy)</small>}
                  </div>
                )}

                <div className="action-buttons">
                  <div className="media-buttons">
                    <label className="media-button">
                      <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleFileSelect} className="file-input" />
                      <div className="button-content"><Image className="button-icon" /><span>Media</span></div>
                    </label>
                    <button onClick={getUserLocation} disabled={isGettingLocation} className="location-button">
                      {isGettingLocation ? <div className="loading-spinner-small" /> : <MapPin className="button-icon" />}
                      <span>{isGettingLocation ? "Getting..." : "Location"}</span>
                    </button>
                  </div>
                  <button onClick={handlePost} disabled={isPosting || (!postContent.trim() && selectedFiles.length === 0)} className="post-button">
                    {isPosting ? <div className="loading-spinner" /> : <Send className="button-icon" />}
                    <span>{isPosting ? "Posting..." : "Post"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="recent-posts-container">
              <div className="section-header">
                <h3 className="section-title">📰 Recent Reports</h3>
              </div>
              <div className="posts-feed">
                {posts.length === 0 ? (
                  <div className="no-posts"><p>No reports yet. Be the first to share an update!</p></div>
                ) : (
                  posts.map((post) => (
                    <div key={post._id || post.id} className="post-item">
                      <div className="post-content">
                        {post.content && <p className="post-text">{post.content}</p>}
                        {post.files?.length > 0 && (
                          <div className="post-media-grid">
                            {post.files.slice(0, 4).map((fileObj, index) => (
                              <div key={index} className="post-media-item">
                                {fileObj.type === "image" && <img src={fileObj.url} alt={fileObj.name} className="post-image" />}
                                {fileObj.type === "video" && <div className="post-media-placeholder"><Video className="media-icon" /></div>}
                                {fileObj.type === "audio" && <div className="post-media-placeholder"><Mic className="media-icon" /></div>}
                              </div>
                            ))}
                          </div>
                        )}
                        {post.location && <div className="post-location"><MapPin className="location-icon-small" /><span>{post.location}</span></div>}
                        <div className="post-timestamp">{new Date(post.createdAt || Date.now()).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
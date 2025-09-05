import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import { Camera, Image, Video, Mic, MapPin, Send, X } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./UserDashboard.css";
import UserDashboardNavbar from "./Navbar/UserDashboardNav";

const UserDashboard = () => {
  const [zones, setZones] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [location, setLocation] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // FETCH USER
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // keep if backend also uses cookies
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/signin");
      }
    };

    // FETCH ZONES (scraped coastline threats from backend)
    const fetchZones = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/disasters/zones`);
        setZones(res.data);
      } catch (err) {
        console.error("Error fetching zones:", err);
      }
    };

    // FETCH POSTS
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts`);
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchUser();
    fetchZones();
    fetchPosts();

    // SOCKET setup
    const backendURL =
      import.meta.env.MODE === "production"
        ? import.meta.env.VITE_BACKEND_PROD_URL
        : import.meta.env.VITE_BACKEND_URL;

    const socket = io(backendURL, {
      transports: ["websocket", "polling"], // ensure fallback works
      withCredentials: true, // only if backend uses cookies
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    // New post
    socket.on("newPost", (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    // Live zone update from scraper backend
    socket.on("zoneUpdate", (updatedZones) => {
      console.log("Realtime zone update:", updatedZones);
      setZones(updatedZones);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // Style based on type
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

      selectedFiles.forEach((f) => {
        formData.append("files", f.file);
      });

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setPostContent("");
      setSelectedFiles([]);
      setLocation("");
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          );
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav>
        <UserDashboardNavbar user={user} />
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-grid">
          {/* Map Section */}
          <div className="map-section">
            <div className="map-container">
              <div className="section-header">
                <h2 className="section-title">🌍 Live Disaster & Coastline Threats</h2>
              </div>
              <div className="map-wrapper">
                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                  />
                  {zones.map((zone, index) => (
                    <Circle
                      key={index}
                      center={[zone.lat, zone.lng]}
                      radius={zone.radius}
                      pathOptions={getZoneStyle(zone.type)}
                    >
                      <Popup>
                        {zone.type === "danger" && "🚨 Danger Prone Zone"}
                        {zone.type === "warning" && "⚠️ Warning Zone"}
                        {zone.type === "safe" && "✅ Safe Zone"}
                        {zone.type === "coastline" && `🌊 Coastline Threat: ${zone.label}`}
                      </Popup>
                    </Circle>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="social-section">
            {/* Create Post */}
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
                          {fileObj.type === "image" && (
                            <img
                              src={fileObj.url}
                              alt={fileObj.name}
                              className="preview-image"
                            />
                          )}
                          {fileObj.type === "video" && (
                            <div className="preview-placeholder">
                              <Video className="placeholder-icon" />
                            </div>
                          )}
                          {fileObj.type === "audio" && (
                            <div className="preview-placeholder">
                              <Mic className="placeholder-icon" />
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="remove-file-btn"
                          >
                            <X className="remove-icon" />
                          </button>
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
                  </div>
                )}

                <div className="action-buttons">
                  <div className="media-buttons">
                    <label className="media-button">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileSelect}
                        className="file-input"
                      />
                      <div className="button-content">
                        <Image className="button-icon" />
                        <span>Media</span>
                      </div>
                    </label>

                    <button onClick={getCurrentLocation} className="location-button">
                      <MapPin className="button-icon" />
                      <span>Location</span>
                    </button>
                  </div>

                  <button
                    onClick={handlePost}
                    disabled={isPosting || (!postContent.trim() && selectedFiles.length === 0)}
                    className="post-button"
                  >
                    {isPosting ? (
                      <div className="loading-spinner" />
                    ) : (
                      <Send className="button-icon" />
                    )}
                    <span>{isPosting ? "Posting..." : "Post"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="recent-posts-container">
              <div className="section-header">
                <h3 className="section-title">📰 Recent Reports</h3>
              </div>

              <div className="posts-feed">
                {posts.length === 0 ? (
                  <div className="no-posts">
                    <p>No reports yet. Be the first to share an update!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post._id || post.id} className="post-item">
                      <div className="post-content">
                        {post.content && <p className="post-text">{post.content}</p>}

                        {post.files?.length > 0 && (
                          <div className="post-media-grid">
                            {post.files.slice(0, 4).map((fileObj, index) => (
                              <div key={index} className="post-media-item">
                                {fileObj.type === "image" && (
                                  <img
                                    src={fileObj.url}
                                    alt={fileObj.name}
                                    className="post-image"
                                  />
                                )}
                                {fileObj.type === "video" && (
                                  <div className="post-media-placeholder">
                                    <Video className="media-icon" />
                                  </div>
                                )}
                                {fileObj.type === "audio" && (
                                  <div className="post-media-placeholder">
                                    <Mic className="media-icon" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {post.location && (
                          <div className="post-location">
                            <MapPin className="location-icon-small" />
                            <span>{post.location}</span>
                          </div>
                        )}

                        <div className="post-timestamp">
                          {new Date(post.createdAt || Date.now()).toLocaleString()}
                        </div>
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

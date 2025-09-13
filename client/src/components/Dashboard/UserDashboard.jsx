import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import { 
  Image, 
  Video, 
  Mic, 
  MapPin, 
  Send, 
  X, 
  Globe,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Waves,
  Megaphone,
  ChevronDown,
  ArrowDown,
  AlertCircle,
  Bell
} from "lucide-react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./UserDashboard.css";
import Cookies from "js-cookie";
import UserDashboardNavbar from "./Navbar/UserDashboardNav";
import Footer from "../Footer/Footer";
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [socket, setSocket] = useState(null);
  
  // New state variables for proximity alert feature
  const [proximityAlert, setProximityAlert] = useState(null);
  const [hasShownAlert, setHasShownAlert] = useState(false);

  const mapRef = useRef(null);
  const navigate = useNavigate();

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  };

  // Function to check if user is in danger zone
  const checkUserInDangerZone = (userLoc, zones) => {
    if (!userLoc || !zones.length) return null;
    
    for (const zone of zones) {
      // Only check danger and warning zones, plus high-severity coastline alerts
      if (zone.type === 'danger' || zone.type === 'warning' || 
          (zone.type === 'coastline' && (zone.color === 'Red' || zone.color === 'Orange'))) {
        
        const distance = calculateDistance(
          userLoc.lat, userLoc.lng,
          zone.lat, zone.lng
        );
        
        // Check if user is within the zone radius
        if (distance <= zone.radius) {
          return {
            zone: zone,
            distance: Math.round(distance),
            severity: zone.type === 'danger' ? 'CRITICAL' : 
                     zone.type === 'warning' ? 'WARNING' :
                     zone.color === 'Red' ? 'RED ALERT' : 'ORANGE ALERT'
          };
        }
      }
    }
    return null;
  };

  // Function to dismiss the alert
  const dismissAlert = () => {
    setProximityAlert(null);
  };

  // ------------------ Helpers for severity zones ------------------
  const parseLatLngFromLocation = (locationStr) => {
    if (!locationStr || typeof locationStr !== "string") return null;
    
    // Try different parsing approaches
    // Approach 1: Direct lat,lng format
    const directMatch = locationStr.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
    
    // Approach 2: Extract all numbers
    const numRegex = /-?\d+(?:\.\d+)?/g;
    const matches = locationStr.match(numRegex);
    if (!matches || matches.length < 2) return null;
    
    const lat = parseFloat(matches[0]);
    const lng = parseFloat(matches[1]);
    
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    
    return null;
  };

  const buildSeverityZones = (postsArray, precision = 2, dangerThreshold = 2) => {
    if (!Array.isArray(postsArray) || postsArray.length === 0) {
      console.log('No posts to build severity zones from');
      return [];
    }

    console.log('Building severity zones from posts:', postsArray.length);
    const buckets = {};
    
    postsArray.forEach((post, index) => {
      console.log(`Processing post ${index}:`, {
        location: post.location,
        coordinates: post.coordinates,
        severityPrediction: post.severityPrediction
      });
      
      let coords = null;
      
      // Try to get coordinates from post.coordinates first
      if (post.coordinates) {
        if (typeof post.coordinates === 'string') {
          try {
            coords = JSON.parse(post.coordinates);
          } catch (e) {
            console.log('Failed to parse coordinates string:', post.coordinates);
          }
        } else if (typeof post.coordinates === 'object' && post.coordinates.lat && post.coordinates.lng) {
          coords = post.coordinates;
        }
      }
      
      // Fallback to parsing location string
      if (!coords && post.location) {
        coords = parseLatLngFromLocation(post.location);
      }
      
      if (!coords) {
        console.log(`No valid coordinates found for post ${index}`);
        return;
      }
      
      console.log(`Valid coordinates for post ${index}:`, coords);
      
      const keyLat = Number(coords.lat.toFixed(precision));
      const keyLng = Number(coords.lng.toFixed(precision));
      const key = `${keyLat},${keyLng}`;
      
      if (!buckets[key]) {
        buckets[key] = { lat: keyLat, lng: keyLng, count: 0, severeCount: 0 };
      }
      
      buckets[key].count += 1;
      if (post.severityPrediction || post.severity === 'high' || post.severity === 'severe') {
        buckets[key].severeCount += 1;
      }
    });

    const zones = Object.values(buckets).map((bucket) => {
      const radiusBase = 1000; // meters - increased base radius
      const maxRadius = 50000; // 50km max radius
      const radius = Math.min(
        Math.round(radiusBase * Math.sqrt(bucket.count)),
        maxRadius
      );
      
      let type = "safe";
      if (bucket.severeCount >= dangerThreshold) {
        type = "danger";
      } else if (bucket.severeCount > 0) {
        type = "warning";
      }
      
      return {
        lat: bucket.lat,
        lng: bucket.lng,
        radius,
        type,
        label: `Reports: ${bucket.count}${
          bucket.severeCount ? ` • Severe: ${bucket.severeCount}` : ""
        }`,
      };
    });

    console.log('Generated severity zones:', zones);
    return zones;
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

  // Initialize Socket.IO with better error handling
  const initializeSocket = () => {
    try {
      const backendURL = import.meta.env.MODE === "production"
        ? import.meta.env.VITE_BACKEND_PROD_URL || import.meta.env.VITE_BACKEND_URL
        : import.meta.env.VITE_BACKEND_URL;

      console.log('Initializing socket connection to:', backendURL);

      const socketInstance = io(backendURL, {
        transports: ["polling", "websocket"], // Try polling first, then websocket
        withCredentials: true,
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      socketInstance.on("connect", () => {
        console.log("Socket connected successfully");
      });

      socketInstance.on("connect_error", (error) => {
        console.warn("Socket connection error:", error.message);
        // Don't show error to user, just log it
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      socketInstance.on("newPost", (newPost) => {
        console.log("Received new post:", newPost);
        setPosts((prev) => [newPost, ...prev]);
      });

      socketInstance.on("zoneUpdate", (updatedZones) => {
        console.log("Received zone update:", updatedZones);
        setZones(updatedZones);
      });

      setSocket(socketInstance);
      
      return socketInstance;
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      return null;
    }
  };

  // ---------------------------------------------------------------

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/signin');
          return;
        }
        
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
        
        if (!res.ok) {
          console.error('Failed to fetch user data, status:', res.status);
          if (res.status === 401) {
            // Token expired or invalid
            Cookies.remove('token');
            navigate('/signin');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        
        const data = await res.json();
        console.log('Raw user data response:', data);
        
        // Handle different response structures
        let userData;
        if (data.success && data.user) {
          userData = data.user;
        } else if (data.user) {
          userData = data.user;
        } else if (data.message === "Authenticated" && data.user) {
          userData = data.user;
        } else {
          userData = data;
        }
        
        // Normalize user data structure
        const normalizedUser = {
          name: userData.name || userData.username || 'Unknown User',
          email: userData.email || 'No email provided', 
          id: userData.id || userData._id || 'unknown',
          avatar: userData.avatar || userData.picture || userData.profilePicture || null,
          role: userData.role || 'user',
          officialId: userData.officialId || null,
          location: userData.location || null,
          isApproved: userData.isApproved !== undefined ? userData.isApproved : true
        };
        
        console.log('Normalized user data:', normalizedUser);
        setUser(normalizedUser);
        
      } catch (err) {
        console.error("Error fetching user:", err);
        // Set a fallback user for development/demo
        const fallbackUser = {
          name: "Demo User",
          email: "demo@varuna.gov.in",
          id: "demo-user",
          avatar: null,
          role: "user"
        };
        setUser(fallbackUser);
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
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched zones from API:', data);
          setZones(data);
        }
      } catch (err) {
        console.error("Error fetching zones:", err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/posts`, { 
          method: 'GET',
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched posts from API:', data);
          const postsFromApi = Array.isArray(data) ? data : [];
          setPosts(postsFromApi);
          
          // Generate severity zones from posts
          const computedZones = buildSeverityZones(postsFromApi, 2, 1); // Lower threshold for testing
          console.log('Computed severity zones:', computedZones);
          
          setZones((prevZones) => {
            // Keep coastline alerts and add severity zones
            const coastlineZones = prevZones.filter((z) => z.type === "coastline");
            const newZones = [...coastlineZones, ...computedZones];
            console.log('Updated zones array:', newZones);
            return newZones;
          });
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    // Initialize everything
    fetchUser();
    fetchZones();
    fetchPosts();
    fetchCoastlineAlerts();
    getUserLocation();
    
    // Initialize socket connection
    const socketInstance = initializeSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [navigate]);

  // Update zones when posts change
  useEffect(() => {
    if (posts.length > 0) {
      const computedZones = buildSeverityZones(posts, 2, 1);
      setZones((prevZones) => {
        const coastlineZones = prevZones.filter((z) => z.type === "coastline");
        return [...coastlineZones, ...computedZones];
      });
    }
  }, [posts]);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      const map = mapRef.current;
      map.flyTo([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  // NEW: Proximity alert check useEffect - Fixed zone reference
  useEffect(() => {
    // Use the combined zones for proximity checking
    const combinedZones = [...zones, ...coastlineAlerts];
    
    // Check proximity when user location or zones change
    if (userLocation && combinedZones.length > 0 && !hasShownAlert) {
      console.log('Checking proximity with zones:', combinedZones.length);
      const alert = checkUserInDangerZone(userLocation, combinedZones);
      
      if (alert) {
        console.log('User in danger zone:', alert);
        setProximityAlert(alert);
        setHasShownAlert(true); // Prevent repeated alerts in same session
        
        // Play alert sound (optional)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS3PDGdSgEKYPM8t1+OQcTZrju4J5NEAtwl9v7z3QoBCaFy/DaiDwIF2W37+eXQgoVc7nV+8NuIAMlgMrx2o5GCxNiubPzpVILA0yl4vK8YhoGN4bV8sp4KwUnisnz24E6Bxd+yPHZhTEIGnK87uaVSgoUcrrK8r5pHgU7hM3u14s9CBdl');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
          console.log('Audio creation failed:', e);
        }
      }
    }
  }, [userLocation, zones, coastlineAlerts, hasShownAlert]);

  // Fix map loading on resize and mobile
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Trigger resize after component mount to ensure map loads on mobile
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Mobile scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const scrolled = window.scrollY > 300;
        setShowScrollButton(scrolled);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToContent = () => {
    const socialSection = document.querySelector('.social-section');
    if (socialSection) {
      socialSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

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
        return { color: "red", fillColor: "red", fillOpacity: 0.4, weight: 3 };
      case "warning":
        return { color: "orange", fillColor: "orange", fillOpacity: 0.4, weight: 2 };
      case "safe":
        return { color: "green", fillColor: "green", fillOpacity: 0.3, weight: 2 };
      case "coastline":
        return { color: "blue", fillColor: "blue", fillOpacity: 0.3, weight: 2 };
      default:
        return { color: "gray", fillColor: "gray", fillOpacity: 0.2, weight: 1 };
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
        const newPost = await response.json();
        // Update posts immediately for instant feedback
        setPosts(prev => [newPost, ...prev]);
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

  // Combine all zones for display - separate severity zones from coastline alerts
  const severityZones = zones.filter(zone => zone.type !== 'coastline');
  const allZones = [...severityZones, ...coastlineAlerts];

  console.log('Rendering zones:', { severityZones: severityZones.length, coastlineAlerts: coastlineAlerts.length, total: allZones.length });

  return (
    <div className="dashboard-container">
      <nav>
        <UserDashboardNavbar user={user} />
      </nav>
      <div className="main-content">
        <div className="content-grid">
          <div className="map-section">
            <div className="section-header">
              <h2 className="section-title">
                <Globe className="section-icon" />
                Live Disaster & Coastline Alert Zones
              </h2>
              {locationError && (
                <div className="location-error">
                  <small>{locationError}</small>
                </div>
              )}
              <div className="alert-stats">
                <span className="stat-item">
                  <BarChart3 className="stat-icon-user" style={{color: '#10b981'}} /> Coastline Alerts: <strong>{coastlineAlerts.length}</strong>
                </span>
                <span className="stat-item">
                  <ShieldAlert className="stat-icon-user" style={{color: '#ef4444'}} /> Danger Zones: <strong>{severityZones.filter(z => z.type === 'danger').length}</strong>
                </span>
                <span className="stat-item">
                  <AlertTriangle className="stat-icon-user" style={{color: '#f59e0b'}} /> Warning Zones: <strong>{severityZones.filter(z => z.type === 'warning').length}</strong>
                </span>
                <span className="stat-item">
                  <CheckCircle className="stat-icon-user" style={{color: '#10b981'}} /> Reports: <strong>{posts.length}</strong>
                </span>
              </div>
            </div>
            <div className="map-container">
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
                  {severityZones.map((zone, index) => (
                    <Circle
                      key={`severity-zone-${index}-${zone.lat}-${zone.lng}`}
                      center={[zone.lat, zone.lng]}
                      radius={zone.radius}
                      pathOptions={getZoneStyle(zone.type)}
                    >
                      <Popup>
                        <div>
                          {zone.type === "danger" && <><ShieldAlert size={16} style={{color: '#ef4444', display: 'inline', marginRight: '4px'}} /> Danger Zone</>}
                          {zone.type === "warning" && <><AlertTriangle size={16} style={{color: '#f59e0b', display: 'inline', marginRight: '4px'}} /> Warning Zone</>}
                          {zone.type === "safe" && <><CheckCircle size={16} style={{color: '#10b981', display: 'inline', marginRight: '4px'}} /> Safe Zone</>}
                          {zone.label && <div style={{marginTop: '4px'}}>{zone.label}</div>}
                          <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                            Radius: {Math.round(zone.radius)}m
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                  
                  {/* Render coastline alerts */}
                  {coastlineAlerts.map((alert, index) => (
                    <Circle
                      key={`coastline-alert-${index}-${alert.lat}-${alert.lng}`}
                      center={[alert.lat, alert.lng]}
                      radius={alert.radius}
                      pathOptions={getCoastlineStyle(alert)}
                    >
                      <Popup>
                        <div className="coastline-popup">
                          <h4 style={{ color: '#1e40af', marginBottom: '8px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Waves size={16} /> {alert.alertType || 'Coastline Alert'}
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
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0' }}>
                              <MapPin size={16} /> Your Location
                            </h4>
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
              
              {/* Enhanced Legend */}
              <div className="map-legend">
                <div className="legend-title">Map Legend:</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#ff0000' }}></div>
                    <span>Danger Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#ffa500' }}></div>
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
                <h2 className="section-title">
                  <Megaphone className="section-icon" />
                  Report Disaster
                </h2>
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

            {/* Debug Info - Remove in production */}
            {/* {import.meta.env.MODE === 'development' && (
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#666'
              }}>
                <h4>Debug Info:</h4>
                <p>Posts loaded: {posts.length}</p>
                <p>Severity zones: {severityZones.length}</p>
                <p>Coastline alerts: {coastlineAlerts.length}</p>
                <p>Socket connected: {socket?.connected ? 'Yes' : 'No'}</p>
                {posts.slice(0, 3).map((post, i) => (
                  <div key={i} style={{marginTop: '10px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px'}}>
                    <p><strong>Post {i+1}:</strong></p>
                    <p>Location: {post.location || 'N/A'}</p>
                    <p>Coordinates: {JSON.stringify(post.coordinates) || 'N/A'}</p>
                    <p>Severity: {post.severityPrediction ? 'High' : 'Normal'}</p>
                  </div>
                ))}
              </div>
            )} */}

            {/* Posts Feed - Add this section */}
            {/* <div className="posts-feed" style={{ marginTop: '30px' }}>
              <div className="section-header">
                <h3 className="section-title">Recent Reports</h3>
              </div>
              {posts.length > 0 ? (
                <div className="posts-list">
                  {posts.slice(0, 5).map((post, index) => (
                    <div key={post._id || index} className="post-item" style={{
                      padding: '15px',
                      marginBottom: '15px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: post.severityPrediction ? '2px solid #ef4444' : '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>
                            {post.user?.name || 'Anonymous User'}
                          </h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                            {post.location || 'Location not available'}
                          </p>
                        </div>
                        {post.severityPrediction && (
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            High Severity
                          </div>
                        )}
                      </div>
                      <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.4' }}>
                        {post.content || 'No content'}
                      </p>
                      {post.createdAt && (
                        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#999' }}>
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <p>No reports available yet.</p>
                  <p style={{ fontSize: '14px' }}>Be the first to report a disaster situation!</p>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
      
      {/* Mobile Scroll Button */}
      {showScrollButton && (
        <button 
          className={`mobile-scroll-button ${showScrollButton ? 'show' : ''}`}
          onClick={scrollToContent}
          aria-label="Scroll to content"
        >
          <ArrowDown />
        </button>
      )}

      {/* Proximity Alert Modal */}
      {proximityAlert && (
        <div className="proximity-alert-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="proximity-alert-modal" style={{
            backgroundColor: proximityAlert.severity === 'CRITICAL' ? '#fef2f2' : 
                            proximityAlert.severity === 'RED ALERT' ? '#fef2f2' : '#fefbf2',
            border: `3px solid ${proximityAlert.severity === 'CRITICAL' ? '#dc2626' : 
                                proximityAlert.severity === 'RED ALERT' ? '#dc2626' : '#f59e0b'}`,
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            position: 'relative',
            animation: 'alertPulse 2s infinite'
          }}>
            <button 
              onClick={dismissAlert}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={24} />
            </button>
            
            <div style={{ 
              fontSize: '48px',
              marginBottom: '20px',
              color: proximityAlert.severity === 'CRITICAL' ? '#dc2626' : 
                     proximityAlert.severity === 'RED ALERT' ? '#dc2626' : '#f59e0b'
            }}>
              {proximityAlert.severity === 'CRITICAL' ? '🚨' :
               proximityAlert.severity === 'RED ALERT' ? '🔴' : '⚠️'}
            </div>
            
            <h2 style={{
              color: proximityAlert.severity === 'CRITICAL' ? '#dc2626' : 
                     proximityAlert.severity === 'RED ALERT' ? '#dc2626' : '#f59e0b',
              marginBottom: '15px',
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={28} />
              {proximityAlert.severity} ALERT
            </h2>
            
            <p style={{
              fontSize: '18px',
              marginBottom: '20px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              <strong>You are currently in a disaster zone!</strong>
              <br />
              Severe alerts have been reported in your nearby area.
            </p>
            
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Zone Type:</strong> {
                  proximityAlert.zone.type === 'danger' ? 'High Severity Danger Zone' :
                  proximityAlert.zone.type === 'warning' ? 'Warning Zone' :
                  proximityAlert.zone.type === 'coastline' ? `Coastline Alert (${proximityAlert.zone.color})` :
                  'Alert Zone'
                }
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Distance from center:</strong> {proximityAlert.distance}m
              </div>
              
              {proximityAlert.zone.label && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Details:</strong> {proximityAlert.zone.label}
                </div>
              )}
              
              {proximityAlert.zone.message && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Message:</strong> {proximityAlert.zone.message}
                </div>
              )}
            </div>
            
            <div style={{
              backgroundColor: proximityAlert.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'left'
            }}>
              <h4 style={{ marginBottom: '10px', color: '#374151' }}>🛡️ Safety Recommendations:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
                <li>Stay alert and monitor local emergency broadcasts</li>
                <li>Keep emergency contacts and supplies ready</li>
                <li>Follow evacuation orders if issued</li>
                <li>Avoid non-essential travel in the area</li>
                <li>Report any immediate dangers to authorities</li>
              </ul>
            </div>
            
            <button 
              onClick={dismissAlert}
              style={{
                backgroundColor: proximityAlert.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b',
                color: 'white',
                padding: '12px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              <Bell size={20} />
              I Understand - Stay Alert
            </button>
          </div>
        </div>
      )}
      
      <Footer />

 {/* CSS Styles for Alert Animation */}
      <style jsx>{`
        @keyframes alertPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        .proximity-alert-overlay {
          backdrop-filter: blur(4px);
        }
        
        /* Mobile responsive styles for proximity alert */
        @media (max-width: 480px) {
          .proximity-alert-modal {
            padding: 15px !important;
            margin: 10px !important;
            width: calc(100vw - 20px) !important;
            max-width: none !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          
          .proximity-alert-modal h2 {
            font-size: 18px !important;
            margin-bottom: 10px !important;
          }
          
          .proximity-alert-modal p {
            font-size: 14px !important;
            margin-bottom: 15px !important;
          }
          
          .proximity-alert-modal div[style*="fontSize: '48px'"] {
            font-size: 36px !important;
            margin-bottom: 15px !important;
          }
          
          .proximity-alert-modal div[style*="backgroundColor: 'rgba(255, 255, 255, 0.7)"] {
            padding: 15px !important;
            margin-bottom: 15px !important;
            font-size: 13px !important;
          }
          
          .proximity-alert-modal ul {
            font-size: 12px !important;
            padding-left: 15px !important;
          }
          
          .proximity-alert-modal button {
            padding: 10px 20px !important;
            font-size: 14px !important;
            width: 100% !important;
            justify-content: center !important;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .proximity-alert-modal {
            padding: 20px !important;
            margin: 15px !important;
            width: calc(100vw - 30px) !important;
            max-width: 450px !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
          }
          
          .proximity-alert-modal h2 {
            font-size: 20px !important;
            margin-bottom: 12px !important;
          }
          
          .proximity-alert-modal p {
            font-size: 16px !important;
          }
          
          .proximity-alert-modal div[style*="fontSize: '48px'"] {
            font-size: 40px !important;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .proximity-alert-modal {
            max-width: 480px !important;
            margin: 20px !important;
          }
        }
        
        /* Ensure modal content doesn't overflow on very small screens */
        @media (max-height: 600px) {
          .proximity-alert-modal {
            max-height: 95vh !important;
            overflow-y: auto !important;
            padding: 15px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
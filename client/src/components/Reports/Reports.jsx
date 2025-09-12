import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  MapPin,
  Video,
  Mic,
  MessageCircle,
  Share2,
  X,
  AlertTriangle,
  User,
  ChevronUp,
  Send,
  Clock,
  Users,
  TrendingUp,
  Search,
  Facebook,
  Twitter,
  Link2,
  RefreshCw
} from "lucide-react";
import { io } from "socket.io-client";
import api from "../../api/axios";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./Reports.css";
import UserDashboardNavbar from "../Dashboard/Navbar/UserDashboardNav";
import Footer from "../Footer/Footer";

// Lazy loading image component
const LazyImage = React.memo(({ src, alt, className, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={imgRef} className={className} {...props}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          onLoad={() => setIsLoaded(true)}
          {...props}
        />
      ) : (
        <div 
          className={`${className} lazy-placeholder`} 
          style={{ 
            backgroundColor: '#f3f4f6', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '200px'
          }}
        >
          <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
        </div>
      )}
    </div>
  );
});


// --- Skeleton Card Component ---
const SkeletonCard = React.memo(() => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-header-avatar"></div>
      <div className="skeleton-header-info">
        <div className="skeleton-header-line short"></div>
        <div className="skeleton-header-line tiny"></div>
      </div>
    </div>
    <div className="skeleton-content">
      <div className="skeleton-content-line"></div>
      <div className="skeleton-content-line medium"></div>
      <div className="skeleton-content-line long"></div>
    </div>
    <div className="skeleton-media"></div>
    <div className="skeleton-actions">
      <div className="skeleton-action-button"></div>
      <div className="skeleton-action-button"></div>
      <div className="skeleton-action-button"></div>
      <div className="skeleton-location"></div>
    </div>
  </div>
));

// --- Location Loading Component ---
const LocationLoader = React.memo(({ location, isLoading }) => {
  if (!location) return null;
  
  // Check if location looks like coordinates
  const isCoordinates = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(location);
  
  return (
    <div className="post-location">
      <MapPin className="location-icon" />
      {isLoading && isCoordinates ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ opacity: 0.7 }}>{location}</span>
          <div className="location-loading-spinner"></div>
        </span>
      ) : (
        <span>{location}</span>
      )}
    </div>
  );
});

// --- Memoized Post Card Component ---
const PostCard = React.memo(({ 
  post, 
  getSeverityBadge, 
  upvotes, 
  handleUpvote, 
  handleToggleComments, 
  handleShare, 
  copiedPostId,
  showComments,
  comments,
  newComment,
  setNewComment,
  handleAddComment,
  user,
  isLoadingLocation
}) => {
  const severity = getSeverityBadge(post.severityPrediction, post.content);
  const postId = post._id || post.id;
  
  return (
    <article key={postId} className="post-card">
      {/* Post Header */}
      <header className="post-header">
        <div className="post-author">
          <div className="post-avatar">
            {post.author?.avatar || post.user?.avatar ? (
              <LazyImage
                src={post.author?.avatar || post.user?.avatar}
                alt={`${post.author?.name || post.user?.name || 'User'}'s Avatar`}
                className="avatar-img"
                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary)' }}
              />
            ) : (
              <img
                src={`https://placehold.co/48x48/1e40af/ffffff?text=${(post.author?.name || post.user?.name || post.username || 'U').charAt(0)}`}
                alt="User Avatar"
                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
              />
            )}
          </div>
          <div className="post-info">
            <div className="post-username">{post.author?.name || post.user?.name || post.username || 'Anonymous Reporter'}</div>
            <div className="post-meta">
              <Clock className="meta-icon" />
              <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="post-severity-badge">
          <span className={`severity-badge ${severity.class}`}>
            {severity.icon} {severity.label}
          </span>
        </div>
      </header>

      {/* Post Content */}
      <div className="post-content">
        {post.content && <p className="post-text">{post.content}</p>}
        
        {/* Location with loading animation */}
        {post.location && (
          <LocationLoader 
            location={post.locationName || post.location} 
            isLoading={isLoadingLocation && post.locationName === undefined}
          />
        )}
      </div>

      {/* Media */}
      {post.files?.length > 0 && (
        <div className="post-media">
          {post.files.map((fileObj, index) => (
            <div key={index} className="post-media-item">
              {fileObj.type === "image" && (
                <LazyImage
                  src={fileObj.url}
                  alt="Report Media"
                  className="post-image"
                />
              )}
              {fileObj.type === "video" && (
                <div className="media-placeholder video-placeholder">
                  <Video className="media-icon" />
                  <span>Video Report</span>
                </div>
              )}
              {fileObj.type === "audio" && (
                <div className="media-placeholder audio-placeholder">
                  <Mic className="media-icon" />
                  <span>Audio Report</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className={`action-button ${upvotes[postId] ? 'upvoted' : ''}`}
          onClick={() => handleUpvote(postId)}
        >
          <ChevronUp className="action-icon" />
          <span>{upvotes[postId] || 0} Upvotes</span>
        </button>
        
        <button
          className="action-button"
          onClick={() => handleToggleComments(postId)}
        >
          <MessageCircle className="action-icon" />
          <span>{comments[postId]?.length || 0} Comments</span>
        </button>
        
        <button
          className="action-button"
          onClick={() => handleShare(postId)}
        >
          <Share2 className="action-icon" />
          <span>Share</span>
        </button>

        {copiedPostId === postId && (
          <div className="copy-notification">✓ Link copied!</div>
        )}
      </div>

      {/* Comments Section */}
      {showComments[postId] && (
        <div className="comments-section">
          <div className="comments-header">
            <h4>Comments ({comments[postId]?.length || 0})</h4>
          </div>
          
          {/* Comment Input */}
          <div className="comment-input">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment[postId] || ''}
              onChange={(e) => setNewComment(prev => ({
                ...prev,
                [postId]: e.target.value
              }))}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(postId)}
              className="comment-field"
            />
            <button
              onClick={() => handleAddComment(postId)}
              className="comment-submit"
            >
              <Send className="send-icon" />
            </button>
          </div>

          {/* Comments List */}
          <div className="comments-list">
            {comments[postId]?.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-avatar">
                  <User className="comment-user-icon" />
                </div>
                <div className="comment-content">
                  <div className="comment-author">{comment.author}</div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-time">{comment.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
});

const Reports = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [copiedPostId, setCopiedPostId] = useState(null);
  const [upvotes, setUpvotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [shareModal, setShareModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [locationCache, setLocationCache] = useState(new Map());
  
  // Pagination and lazy loading states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allPostsData, setAllPostsData] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(new Set());
  const POSTS_PER_PAGE = 10;
  
// Improved reverse geocoding with better address parsing and fallback services
const reverseGeocode = useCallback(async (lat, lon) => {
  const key = `${lat},${lon}`;
  if (locationCache.has(key)) {
    return locationCache.get(key);
  }
  
  // Convert string coordinates to numbers if needed
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    const fallback = `Invalid coordinates`;
    setLocationCache(prev => new Map(prev).set(key, fallback));
    return fallback;
  }
  
  console.log(`🌍 Geocoding: ${latitude}, ${longitude}`);
  
  // Try primary geocoding service (Nominatim)
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { 
        format: "json", 
        lat: latitude, 
        lon: longitude,
        addressdetails: 1,
        zoom: 10 // This helps get city-level details
      },
      headers: { "User-Agent": "VarunaDisasterApp/1.0" },
      timeout: 8000 // 8 second timeout
    });

    const data = res.data;
    console.log('📍 Geocoding response:', data);
    
    if (!data || !data.address) {
      throw new Error('No address data received');
    }

    // Try multiple address components for better coverage
    const address = data.address;
    const locationParts = [];
    
    // Primary location (city/town/village)
    const primaryLocation = address.city || 
                           address.town || 
                           address.village || 
                           address.municipality || 
                           address.suburb || 
                           address.neighbourhood || 
                           address.hamlet;
    
    if (primaryLocation) {
      locationParts.push(primaryLocation);
    }
    
    // State/Region
    const region = address.state || 
                  address.region || 
                  address.province || 
                  address.county;
    
    if (region) {
      locationParts.push(region);
    }
    
    // Country as last resort if no city/state found
    if (locationParts.length === 0 && address.country) {
      locationParts.push(address.country);
    }
    
    let locationName = locationParts.join(", ");
    
    // If still no meaningful name found, use display_name or fallback
    if (!locationName || locationName.length < 3) {
      // Try to extract meaningful parts from display_name
      if (data.display_name) {
        const displayParts = data.display_name.split(',').map(part => part.trim());
        // Take first 2 meaningful parts (usually city, state)
        locationName = displayParts.slice(0, 2).join(', ');
      }
    }
    
    // Final fallback - if still no good name, use a more descriptive format
    if (!locationName || locationName.length < 3) {
      locationName = `Location ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    }
      
    console.log(`✅ Geocoded to: ${locationName}`);
    setLocationCache(prev => new Map(prev).set(key, locationName));
    return locationName;
    
  } catch (nominatimError) {
    console.warn("Nominatim geocoding failed, trying fallback:", nominatimError.message);
    
    // Try fallback service (BigDataCloud - free tier)
    try {
      const fallbackRes = await axios.get("https://api.bigdatacloud.net/data/reverse-geocode-client", {
        params: {
          latitude: latitude,
          longitude: longitude,
          localityLanguage: 'en'
        },
        timeout: 5000
      });
      
      const fallbackData = fallbackRes.data;
      console.log('🔄 Fallback geocoding response:', fallbackData);
      
      if (fallbackData) {
        const locationParts = [];
        
        if (fallbackData.city) locationParts.push(fallbackData.city);
        else if (fallbackData.locality) locationParts.push(fallbackData.locality);
        
        if (fallbackData.principalSubdivision) locationParts.push(fallbackData.principalSubdivision);
        else if (fallbackData.countryName && locationParts.length === 0) locationParts.push(fallbackData.countryName);
        
        if (locationParts.length > 0) {
          const locationName = locationParts.join(', ');
          console.log(`✅ Fallback geocoded to: ${locationName}`);
          setLocationCache(prev => new Map(prev).set(key, locationName));
          return locationName;
        }
      }
    } catch (fallbackError) {
      console.warn("Fallback geocoding also failed:", fallbackError.message);
    }
    
    // If both services fail, check if coordinates look like they're in a known region
    let regionGuess = '';
    if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
      regionGuess = ', India';
    } else if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
      regionGuess = ', USA';
    }
    
    // More descriptive fallback with region guess
    const fallback = `Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}${regionGuess}`;
    setLocationCache(prev => new Map(prev).set(key, fallback));
    return fallback;
  }
}, [locationCache]);

// Reusable disaster post filtering function
const isDisasterPost = useCallback((post) => {
  const hasDisasterKeywords = post.content && (
    post.content.toLowerCase().includes('flood') ||
    post.content.toLowerCase().includes('emergency') ||
    post.content.toLowerCase().includes('help') ||
    post.content.toLowerCase().includes('urgent') ||
    post.content.toLowerCase().includes('cyclone') ||
    post.content.toLowerCase().includes('storm') ||
    post.content.toLowerCase().includes('rain') ||
    post.content.toLowerCase().includes('disaster') ||
    post.content.toLowerCase().includes('dub') ||
    post.content.toLowerCase().includes('bachao')
  );
  
  const hasValidSeverity = post.severityPrediction && 
    ['high_risk', 'mild_risk', 'low_risk'].includes(post.severityPrediction);
  
  return hasDisasterKeywords || hasValidSeverity;
}, []);

  // Fetch user data
  const fetchUser = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        console.log('No token found for user fetch');
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
      
      if (res.ok) {
        const data = await res.json();
        console.log('User data for reports:', data);
        
        // Handle different response structures
        let userData;
        if (data.success && data.user) {
          userData = data.user;
        } else if (data.user) {
          userData = data.user;
        } else {
          console.warn('Unexpected user data structure:', data);
          userData = data;
        }
        
        // Normalize user data structure with proper field mapping
        const normalizedUser = {
          name: userData.name || userData.username || 'Anonymous User',
          email: userData.email || 'No email provided',
          id: userData.id || userData._id || 'unknown',
          avatar: userData.avatar || userData.picture || null,
          role: userData.role || 'user',
          officialId: userData.officialId || null,
          location: userData.location || null,
          isApproved: userData.isApproved !== undefined ? userData.isApproved : true
        };
        
        setUser(normalizedUser);
      }
    } catch (err) {
      console.error("Error fetching user for reports:", err);
      setUser({
        name: "Demo User",
        email: "demo@varuna.gov.in",
        id: "demo-user",
        avatar: null
      });
    }
  };

  // Fast initial load - fetch minimal data first
  const fetchInitialPosts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`
      );

      if (Array.isArray(res.data)) {
        const severityOrder = { high_risk: 1, mild_risk: 2, low_risk: 3 };

        // Filter and sort all posts, but don't process locations yet
        const filteredPosts = res.data
          .filter(isDisasterPost)
          .sort((a, b) => {
            const severityA = severityOrder[a.severityPrediction] || 99;
            const severityB = severityOrder[b.severityPrediction] || 99;
            return severityA !== severityB
              ? severityA - severityB
              : new Date(b.createdAt) - new Date(a.createdAt);
          });

        // Store all posts data
        setAllPostsData(filteredPosts);
        
        // INSTANT LOADING: Show posts immediately with raw coordinates
        const initialPosts = filteredPosts.slice(0, POSTS_PER_PAGE);
        setPosts(initialPosts); // Show posts immediately!
        setHasMorePosts(filteredPosts.length > POSTS_PER_PAGE);
        
        // Initialize comments for initial posts
        const initialComments = {};
        initialPosts.forEach(post => {
          initialComments[post._id] = [];
        });
        setComments(initialComments);
        
        console.log(`⚡ Loaded ${initialPosts.length} posts INSTANTLY! Now geocoding in background...`);
        
        // BACKGROUND GEOCODING: Process location names after posts are shown
        setTimeout(() => {
          initialPosts.forEach(async (post, index) => {
            if (post.location && typeof post.location === 'string') {
              const locationParts = post.location.split(",").map(v => v.trim());
              if (locationParts.length === 2) {
                const [lat, lon] = locationParts;
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);
                
                if (!isNaN(latNum) && !isNaN(lonNum) && Math.abs(latNum) <= 90 && Math.abs(lonNum) <= 180) {
                  // Mark this post as loading
                  setLoadingLocations(prev => new Set(prev).add(post._id));
                  
                  console.log(`🌍 Background geocoding ${index + 1}/${initialPosts.length}: ${lat}, ${lon}`);
                  try {
                    const locationName = await reverseGeocode(lat, lon);
                    if (locationName && locationName !== post.location) {
                      // Update the specific post with new location name
                      setPosts(prevPosts => 
                        prevPosts.map(p => 
                          p._id === post._id 
                            ? { ...p, locationName }
                            : p
                        )
                      );
                      console.log(`✅ Updated location for post ${post._id}: ${locationName}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Geocoding failed for ${lat}, ${lon}:`, error);
                  } finally {
                    // Remove loading state
                    setLoadingLocations(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(post._id);
                      return newSet;
                    });
                  }
                }
              }
            }
          });
        }, 100); // Start geocoding after 100ms
      } else {
        console.error("Server response is not an array:", res.data);
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isDisasterPost, POSTS_PER_PAGE]);

  useEffect(() => {
    // Register service worker for API caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('📦 Service worker registered for API caching'))
        .catch(error => console.log('❌ Service worker registration failed:', error));
    }
    
    // Fetch initial posts immediately - much faster now!
    fetchInitialPosts();

    const backendURL =
      import.meta.env.MODE === "production"
        ? import.meta.env.VITE_BACKEND_PROD_URL
        : import.meta.env.VITE_BACKEND_URL;

    const socket = io(backendURL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => { 
      console.log("Socket connected:", socket.id);
      setSocketConnected(true);
    });
    socket.on("disconnect", () => { 
      console.log("Socket disconnected");
      setSocketConnected(false);
    });
    
    socket.on("newPost", async (newPost) => {
      console.log("📨 Received new post via socket:", newPost);
      
      // Use the reusable filter function
      if (isDisasterPost(newPost)) {
        // Process location name for the new post
        let locationName = newPost.location;
        if (newPost.location) {
          const [lat, lon] = newPost.location.split(",").map(v => v.trim());
          if (!isNaN(lat) && !isNaN(lon)) {
            const name = await reverseGeocode(lat, lon);
            if (name) locationName = name;
          }
        }
        
        const processedPost = { ...newPost, locationName };
        console.log("✅ Adding new post to reports:", processedPost);
        setPosts((prev) => [processedPost, ...prev]);
      } else {
        console.log("⚠️ Skipping non-disaster post:", newPost.severityPrediction);
      }
    });

    // Fetch user data
    fetchUser();
    
    return () => {
      socket.disconnect();
    };
  }, []);

  // New useEffect to manage the copied message
  useEffect(() => {
    if (copiedPostId) {
      const timer = setTimeout(() => {
        setCopiedPostId(null);
      }, 1500); // Message disappears after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [copiedPostId]);

const handleUpvote = useCallback(async (postId) => {
  setUpvotes((prevUpvotes) => ({
    ...prevUpvotes,
    [postId]: (prevUpvotes[postId] || 0) + 1,
  }));

  try {
    const res = await api.post(`/api/posts/upvote/${postId}`);
    if (res.data.success) {
      console.log("Upvote registered on the server");
    }
  } catch (error) {
    console.error("Upvote failed:", error);
  }
}, []);

  const handleShare = useCallback((postId) => {
    setShareModal(postId);
  }, []);

  const handleCopyLink = useCallback((postId) => {
    const postUrl = `${window.location.origin}/reports/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopiedPostId(postId);
      setShareModal(null);
    });
  }, []);

  const handleSocialShare = useCallback((platform, postId) => {
    const postUrl = `${window.location.origin}/reports/${postId}`;
    const text = "Check out this disaster report from our community:";
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, '_blank');
        break;
      default:
        break;
    }
    setShareModal(null);
  }, []);

  const handleToggleComments = useCallback((postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, []);

  const handleAddComment = useCallback((postId) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    const comment = {
      id: Date.now(),
      text: commentText,
      author: user?.name || 'Anonymous User',
      timestamp: new Date().toLocaleString()
    };

    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment]
    }));

    setNewComment(prev => ({
      ...prev,
      [postId]: ''
    }));
  }, [newComment, user?.name]);

  // Polling fallback to keep posts fresh only when socket is disconnected
  useEffect(() => {
    if (socketConnected) return; // Only poll when disconnected

    console.log('🕒 Starting polling fallback for reports...');
    const interval = setInterval(() => {
      refreshPosts();
    }, 30000); // Reduced frequency: every 30s instead of 15s

    return () => {
      clearInterval(interval);
      console.log('🕒 Stopped polling fallback for reports.');
    };
  }, [socketConnected]);

  const refreshPosts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`
      );

      if (Array.isArray(res.data)) {
        const severityOrder = { high_risk: 1, mild_risk: 2, low_risk: 3 };

        // Filter and sort all posts
        const filteredPosts = res.data
          .filter(isDisasterPost)
          .sort((a, b) => {
            const severityA = severityOrder[a.severityPrediction] || 99;
            const severityB = severityOrder[b.severityPrediction] || 99;
            return severityA !== severityB
              ? severityA - severityB
              : new Date(b.createdAt) - new Date(a.createdAt);
          });

        // Update all posts data
        setAllPostsData(filteredPosts);
        
        // Reset to first page and load initial posts
        const initialPosts = filteredPosts.slice(0, POSTS_PER_PAGE);
        setPosts(initialPosts);
        setCurrentPage(1);
        setHasMorePosts(filteredPosts.length > POSTS_PER_PAGE);
        
        console.log("✅ Posts refreshed successfully:", initialPosts.length, "of", filteredPosts.length);
      }
    } catch (err) {
      console.error("Error refreshing posts:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isDisasterPost, POSTS_PER_PAGE]);

  // Load more posts with lazy geocoding
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMorePosts) return;
    
    setIsLoadingMore(true);
    try {
      const startIndex = currentPage * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;
      const nextPagePosts = allPostsData.slice(startIndex, endIndex);
      
      if (nextPagePosts.length > 0) {
        // INSTANT LOADING: Add posts immediately without geocoding
        setPosts(prevPosts => [...prevPosts, ...nextPagePosts]);
        
        console.log(`⚡ Added ${nextPagePosts.length} posts instantly! Geocoding in background...`);
        
        // BACKGROUND GEOCODING: Process locations after posts are shown
        setTimeout(() => {
          nextPagePosts.forEach(async (post, index) => {
            if (post.location && typeof post.location === 'string') {
              const locationParts = post.location.split(",").map(v => v.trim());
              if (locationParts.length === 2) {
                const [lat, lon] = locationParts;
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);
                
                if (!isNaN(latNum) && !isNaN(lonNum) && Math.abs(latNum) <= 90 && Math.abs(lonNum) <= 180) {
                  // Mark this post as loading
                  setLoadingLocations(prev => new Set(prev).add(post._id));
                  
                  console.log(`🌍 Background geocoding more post ${index + 1}/${nextPagePosts.length}: ${lat}, ${lon}`);
                  try {
                    const locationName = await reverseGeocode(lat, lon);
                    if (locationName && locationName !== post.location) {
                      // Update the specific post
                      setPosts(prevPosts => 
                        prevPosts.map(p => 
                          p._id === post._id 
                            ? { ...p, locationName }
                            : p
                        )
                      );
                      console.log(`✅ Updated location for more post ${post._id}: ${locationName}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Geocoding failed for ${lat}, ${lon}:`, error);
                  } finally {
                    // Remove loading state
                    setLoadingLocations(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(post._id);
                      return newSet;
                    });
                  }
                }
              }
            }
          });
        }, 50);
        
        setCurrentPage(prev => prev + 1);
        setHasMorePosts(endIndex < allPostsData.length);
        
        // Initialize comments for new posts
        setComments(prevComments => {
          const newComments = { ...prevComments };
          nextPagePosts.forEach(post => {
            newComments[post._id] = [];
          });
          return newComments;
        });
        
        console.log(`✅ Loaded ${nextPagePosts.length} more posts instantly! (${endIndex}/${allPostsData.length})`);
      } else {
        setHasMorePosts(false);
      }
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, POSTS_PER_PAGE, allPostsData, hasMorePosts, isLoadingMore, locationCache, reverseGeocode]);

  // Infinite scroll observer
  const loadMoreRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMorePosts && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMorePosts, hasMorePosts, isLoadingMore]);

  const getSeverityBadge = useCallback((severity, postContent = '') => {
    // Override non_disaster if post has emergency keywords
    if (severity === 'non_disaster' && postContent) {
      const emergencyKeywords = ['emergency', 'urgent', 'help', 'bachao', 'dub', 'flood', 'cyclone'];
      const hasEmergency = emergencyKeywords.some(keyword => 
        postContent.toLowerCase().includes(keyword)
      );
      if (hasEmergency) {
        severity = 'mild_risk'; // Override to show as mild risk
      }
    }
    
    const severityMap = {
      high_risk: { label: 'High Risk', class: 'high-risk', icon: '🚨' },
      mild_risk: { label: 'Mild Risk', class: 'mild-risk', icon: '⚠️' },
      low_risk: { label: 'Low Risk', class: 'low-risk', icon: '⚡' },
      non_disaster: { label: 'Report', class: 'report', icon: '📝' }
    };
    return severityMap[severity] || { label: 'Community Post', class: 'community', icon: '💬' };
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesFilter = filter === 'all' || post.severityPrediction === filter;
      const matchesSearch = searchTerm === '' || 
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [posts, filter, searchTerm]);

  return (
    <div className="reports-container">
      <UserDashboardNavbar user={user} />
      
      {/* Simple loading state - no overlay */}
      {isLoading && (
        <div className="reports-main-content">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>Loading community reports...</p>
          </div>
        </div>
      )}

      <div className="reports-main-content">
        {/* Enhanced Header */}
        <header className="reports-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="reports-title">
                <TrendingUp className="title-icon" />
                Community Reports
              </h1>
              <p className="reports-subtitle">
                Real-time disaster reports and community updates from across the region
              </p>
            </div>
            <div className="header-stats">
              <div className="stat-card">
                <Users className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-number">{posts.length}</span>
                  <span className="stat-label">Active Reports</span>
                </div>
              </div>
              <div className="stat-card">
                <AlertTriangle className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-number">{posts.filter(p => p.severityPrediction === 'high_risk').length}</span>
                  <span className="stat-label">High Priority</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="controls-section">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search reports by content or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={refreshPosts}
              disabled={isRefreshing}
              className="refresh-button"
              title="Refresh posts"
            >
              <RefreshCw className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{socketConnected ? 'Live' : 'Polling'}</span>
            </div>
          </div>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Reports
            </button>
            <button 
              className={`filter-tab ${filter === 'high_risk' ? 'active' : ''}`}
              onClick={() => setFilter('high_risk')}
            >
              🚨 High Risk
            </button>
            <button 
              className={`filter-tab ${filter === 'mild_risk' ? 'active' : ''}`}
              onClick={() => setFilter('mild_risk')}
            >
              ⚠️ Mild Risk
            </button>
            <button 
              className={`filter-tab ${filter === 'low_risk' ? 'active' : ''}`}
              onClick={() => setFilter('low_risk')}
            >
              ⚡ Low Risk
            </button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="reports-grid">
          {/* Show loading skeletons during initial load */}
          {isLoading && (
            Array.from({ length: POSTS_PER_PAGE }, (_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          )}
          
          {/* Show actual posts */}
          {!isLoading && filteredPosts.length === 0 ? (
            <div className="no-reports">
              <AlertTriangle className="no-reports-icon" />
              <h3>No reports found</h3>
              <p>
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'No reports have been submitted yet. Be the first to share an update!'}
              </p>
            </div>
          ) : (
            <>
              {filteredPosts.map((post) => (
                <PostCard
                  key={post._id || post.id}
                  post={post}
                  getSeverityBadge={getSeverityBadge}
                  upvotes={upvotes}
                  handleUpvote={handleUpvote}
                  handleToggleComments={handleToggleComments}
                  handleShare={handleShare}
                  copiedPostId={copiedPostId}
                  showComments={showComments}
                  comments={comments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleAddComment={handleAddComment}
                  user={user}
                  isLoadingLocation={loadingLocations.has(post._id)}
                />
              ))}
              
              {/* Infinite scroll trigger and loading more indicator */}
              {hasMorePosts && (
                <div ref={loadMoreRef} className="load-more-trigger" style={{ padding: '2rem', textAlign: 'center' }}>
                  {isLoadingMore ? (
                    <>
                      <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                      <p>Loading more reports...</p>
                      {/* Show skeleton cards while loading more */}
                      <div style={{ display: 'grid', gap: 'var(--space-6)', marginTop: '1rem' }}>
                        {Array.from({ length: 3 }, (_, i) => (
                          <SkeletonCard key={`loading-skeleton-${i}`} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p>Scroll down to load more reports...</p>
                      <button 
                        onClick={loadMorePosts}
                        disabled={isLoadingMore}
                        style={{
                          marginTop: '1rem',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        Load More Posts
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {!hasMorePosts && posts.length > 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p>You've reached the end! ✨</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Share Modal */}
      {shareModal && (
        <div className="modal-overlay" onClick={() => setShareModal(null)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Report</h3>
              <button onClick={() => setShareModal(null)} className="modal-close">
                <X className="close-icon" />
              </button>
            </div>
            <div className="share-options">
              <button
                onClick={() => handleCopyLink(shareModal)}
                className="share-option"
              >
                <Link2 className="share-icon" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => handleSocialShare('facebook', shareModal)}
                className="share-option facebook"
              >
                <Facebook className="share-icon" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handleSocialShare('twitter', shareModal)}
                className="share-option twitter"
              >
                <Twitter className="share-icon" />
                <span>Twitter</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Reports;
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Video,
  Mic,
  Heart,
  MessageCircle,
  Share2,
  Menu,
  X,
  Home,
  Map,
  AlertTriangle,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Activity,
  ChevronUp,
  Copy,
  Send,
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Filter,
  Search,
  Facebook,
  Twitter,
  Link2,
  Download,
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


// --- Skeleton Card Component ---
const SkeletonCard = () => (
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
);

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { format: "json", lat, lon },
     // headers: { "User-Agent": "YourApp/1.0" }, // Nominatim ko ye zaruri hai
    });

    const data = res.data;
    return [
      data?.address?.city || data?.address?.town || data?.address?.village,
      data?.address?.state,
    ]
      .filter(Boolean)
      .join(", ");
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
};
  // Enhanced loading progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    const completeLoading = setTimeout(() => {
      setLoadingProgress(100);
      clearInterval(progressInterval);
    }, 1400);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeLoading);
    };
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/posts`
        );

if (Array.isArray(res.data)) {
  const severityOrder = { high_risk: 1, mild_risk: 2, low_risk: 3 };

  const filtered = await Promise.all(
    res.data
      .filter(post => {
        // Show posts if they have disaster-related keywords OR legitimate severity
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
      })
      .sort((a, b) => {
        const severityA = severityOrder[a.severityPrediction] || 99;
        const severityB = severityOrder[b.severityPrediction] || 99;
        return severityA !== severityB
          ? severityA - severityB
          : new Date(b.createdAt) - new Date(a.createdAt);
      })
      .map(async (post) => {
        let locationName = post.location;
        if (post.location) {
          const [lat, lon] = post.location.split(",").map(v => v.trim());
          if (!isNaN(lat) && !isNaN(lon)) {
            const name = await reverseGeocode(lat, lon);
            if (name) locationName = name;
          }
        }
        return { ...post, locationName };
      })
  );

  setPosts(filtered);
  // Initialize comments for each post
  const initialComments = {};
  filtered.forEach(post => {
    initialComments[post._id] = [];
  });
  setComments(initialComments);
}else {
          console.error("Server response is not an array:", res.data);
          setPosts([]);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadingTimer = setTimeout(() => {
      fetchPosts();
    }, 1500);

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
      
      // Check if post should be displayed using same logic as fetch
      const hasDisasterKeywords = newPost.content && (
        newPost.content.toLowerCase().includes('flood') ||
        newPost.content.toLowerCase().includes('emergency') ||
        newPost.content.toLowerCase().includes('help') ||
        newPost.content.toLowerCase().includes('urgent') ||
        newPost.content.toLowerCase().includes('cyclone') ||
        newPost.content.toLowerCase().includes('storm') ||
        newPost.content.toLowerCase().includes('rain') ||
        newPost.content.toLowerCase().includes('disaster') ||
        newPost.content.toLowerCase().includes('dub') ||
        newPost.content.toLowerCase().includes('bachao')
      );
      
      const hasValidSeverity = newPost.severityPrediction && 
        ['high_risk', 'mild_risk', 'low_risk'].includes(newPost.severityPrediction);
      
      if (hasDisasterKeywords || hasValidSeverity) {
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
    
    return () => clearTimeout(loadingTimer);
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

const handleUpvote = async (postId) => {
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
};
  const handleShare = (postId) => {
    setShareModal(postId);
  };

  const handleCopyLink = (postId) => {
    const postUrl = `${window.location.origin}/reports/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopiedPostId(postId);
      setShareModal(null);
    });
  };

  const handleSocialShare = (platform, postId) => {
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
  };

  const handleToggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = (postId) => {
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
  };

  // Polling fallback to keep posts fresh if socket isn't updating
  useEffect(() => {
    // Start polling if not connected or if no posts yet
    const shouldPoll = !socketConnected;
    if (!shouldPoll) return;

    console.log('🕒 Starting polling fallback for reports...');
    const interval = setInterval(() => {
      refreshPosts();
    }, 15000); // every 15s

    // Do an immediate refresh when polling starts
    refreshPosts();

    return () => {
      clearInterval(interval);
      console.log('🕒 Stopped polling fallback for reports.');
    };
  }, [socketConnected]);

  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`
      );

      if (Array.isArray(res.data)) {
        const severityOrder = { high_risk: 1, mild_risk: 2, low_risk: 3 };

        const filtered = await Promise.all(
          res.data
            .filter(post => {
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
            })
            .sort((a, b) => {
              const severityA = severityOrder[a.severityPrediction] || 99;
              const severityB = severityOrder[b.severityPrediction] || 99;
              return severityA !== severityB
                ? severityA - severityB
                : new Date(b.createdAt) - new Date(a.createdAt);
            })
            .map(async (post) => {
              let locationName = post.location;
              if (post.location) {
                const [lat, lon] = post.location.split(",").map(v => v.trim());
                if (!isNaN(lat) && !isNaN(lon)) {
                  const name = await reverseGeocode(lat, lon);
                  if (name) locationName = name;
                }
              }
              return { ...post, locationName };
            })
        );

        setPosts(filtered);
        console.log("✅ Posts refreshed successfully:", filtered.length);
      }
    } catch (err) {
      console.error("Error refreshing posts:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSeverityBadge = (severity, postContent = '') => {
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
  };

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.severityPrediction === filter;
    const matchesSearch = post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && (searchTerm === '' || matchesSearch);
  });

  return (
    <div className="reports-container">
      <UserDashboardNavbar user={user} />
      
      {/* Enhanced Loading Screen */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2 className="loading-title">Loading Community Reports</h2>
            <div className="loading-progress">
              <div 
                className="loading-progress-bar" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="loading-text">{loadingProgress < 50 ? 'Fetching latest updates...' : loadingProgress < 90 ? 'Processing locations...' : 'Almost ready!'}</p>
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
            filteredPosts.map((post) => {
              const severity = getSeverityBadge(post.severityPrediction, post.content);
              const postId = post._id || post.id;
              
              return (
                <article key={postId} className="post-card">
                  {/* Post Header */}
                  <header className="post-header">
                    <div className="post-author">
                      <div className="post-avatar">
                        {post.author?.avatar || post.user?.avatar ? (
                          <img
                            src={post.author?.avatar || post.user?.avatar}
                            alt={`${post.author?.name || post.user?.name || 'User'}'s Avatar`}
                            onError={(e) => {
                              e.target.src = "https://placehold.co/48x48/1e40af/ffffff?text=" + ((post.author?.name || post.user?.name || 'U').charAt(0));
                            }}
                          />
                        ) : (
                          <img
                            src={`https://placehold.co/48x48/1e40af/ffffff?text=${(post.author?.name || post.user?.name || post.username || 'U').charAt(0)}`}
                            alt="User Avatar"
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
                    
                    {/* Location */}
                    {post.location && (
                      <div className="post-location">
                        <MapPin className="location-icon" />
                        <span>{post.locationName || post.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {post.files?.length > 0 && (
                    <div className="post-media">
                      {post.files.map((fileObj, index) => (
                        <div key={index} className="post-media-item">
                          {fileObj.type === "image" && (
                            <img
                              src={fileObj.url}
                              alt="Report Media"
                              className="post-image"
                              loading="lazy"
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
            })
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

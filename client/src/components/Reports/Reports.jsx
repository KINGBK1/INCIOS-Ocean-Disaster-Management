import React, { useState, useEffect } from 'react';
import { MapPin, Video, Mic, Heart, MessageCircle, Share2, Menu, X, Home, Map, AlertTriangle, MessageSquare, Bell, Settings, User, LogOut, ChevronDown, Shield, Activity, ChevronUp, Copy } from 'lucide-react';
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import './Reports.css'; 
import UserDashboardNavbar from '../Dashboard/Navbar/UserDashboardNav';

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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts`);
        
        if (Array.isArray(res.data)) {
            setPosts(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } else {
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

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("newPost", (newPost) => setPosts((prev) => [newPost, ...prev]));
    socket.on("zoneUpdate", (updatedZones) => setZones(updatedZones));

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

  const handleUpvote = (postId) => {
    setUpvotes(prevUpvotes => ({
      ...prevUpvotes,
      [postId]: (prevUpvotes[postId] || 0) + 1
    }));
  };

  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}/reports/${postId}`;
    const tempInput = document.createElement('input');
    tempInput.value = postUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    
    setCopiedPostId(postId);
    
    document.body.removeChild(tempInput);
  };

  return (
    <div className="reports-container">
      <UserDashboardNavbar user={user} />
      <div className="reports-main-content">
        <header className="reports-header">
          <h1 className="reports-title">Community Reports</h1>
          <p className="reports-subtitle">Explore real-time disaster reports and updates from the community.</p>
        </header>
        <div className="reports-grid">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : posts.length === 0 ? (
            <div className="no-reports">
              <p>No reports have been submitted yet. Be the first to share an update!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id || post.id} className="post-card">
                <div className="post-header">
                  <div className="post-avatar">
                    <img src="https://placehold.co/40x40/d1d9e2/4a5568?text=U" alt="User Avatar" />
                  </div>
                  <div className="post-info">
                    <div className="post-username">Anonymous User</div>
                    <div className="post-timestamp">{new Date(post.createdAt || Date.now()).toLocaleString()}</div>
                  </div>
                </div>
                <div className="post-content">
                  {post.content && <p className="post-text">{post.content}</p>}
                </div>
                {post.files?.length > 0 && (
                  <div className="post-media">
                    {post.files.map((fileObj, index) => (
                      <div key={index} className="post-media-item">
                        {fileObj.type === "image" && (
                          <img src={fileObj.url} alt="Report Media" className="post-image" />
                        )}
                        {fileObj.type === "video" && (
                          <div className="media-placeholder">
                            <Video className="media-icon" />
                            <span>Video</span>
                          </div>
                        )}
                        {fileObj.type === "audio" && (
                          <div className="media-placeholder">
                            <Mic className="media-icon" />
                            <span>Audio</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="post-actions">
                  <div className="post-action-button" onClick={() => handleUpvote(post._id)}>
                    <ChevronUp className="action-icon" />
                    <span>Upvote {upvotes[post._id] > 0 ? upvotes[post._id] : ''}</span>
                  </div>
                  <div className="post-action-button">
                    <MessageCircle className="action-icon" />
                    <span>Comment</span>
                  </div>
                  {/* Share button with simple hover message */}
                  <div className="post-action-button relative" onClick={() => handleShare(post._id)}>
                    <Share2 className="action-icon" />
                    <span>Share</span>
                    {copiedPostId === post._id && (
                      <div className="copy-message">
                        Link copied!
                      </div>
                    )}
                  </div>
                  {post.location && (
                    <div className="post-location">
                      <MapPin className="location-icon" />
                      <span>{post.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
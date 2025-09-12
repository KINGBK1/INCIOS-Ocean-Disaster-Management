import React, { useState, useRef, useEffect, useContext } from "react";
import {
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
} from "lucide-react";
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../../Auth/context/AuthContext"; // Import AuthContext
import "./UserDashboardNav.css";

const UserDashboardNavbar = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const profileRef = useRef(null);

  const safeUser = user || {
    name: "Loading...",
    email: "Loading...",
    avatar: null,
    role: "user"
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const handleProfile = () => {
    navigate("/profile-settings");
    setIsProfileOpen(false);
  };

  const clearNotifications = () => {
    setNotifications(0);
  };

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Live Map", icon: Map, href: "/map" },
    { name: "Alerts", icon: AlertTriangle, href: "/alerts" },
    { name: "Reports", icon: MessageSquare, href: "/reports" },
   // { name: "Analytics", icon: Activity, href: "/analytics" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-brand">
          <div className="brand-logo">
            <Shield className="logo-icon" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">VARUNA</h1>
        
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <item.icon className="nav-icon" />
              <span className="nav-text">{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Notifications */}
          <div className="notification-container">
            <button className="notification-btn" onClick={clearNotifications}>
              <Bell className="notification-icon" />
              {notifications > 0 && (
                <span className="notification-badge">{notifications}</span>
              )}
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="profile-container" ref={profileRef}>
            <button className="profile-btn" onClick={toggleProfile}>
              <div className="profile-avatar">
                {safeUser?.avatar ? (
                  <img
                    src={safeUser.avatar}
                    alt="Profile"
                    className="avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div 
                  className="avatar-fallback"
                  style={{
                    display: safeUser?.avatar ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#e2e8f0',
                    color: '#64748b',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  {safeUser?.name?.charAt(0)?.toUpperCase() || <User className="avatar-icon" />}
                </div>
              </div>
              <div className="profile-info">
                <span className="profile-name">{safeUser?.name || "User"}</span>
                <span className="profile-role">{safeUser?.role === "admin" ? "Administrator" : safeUser?.role === "ngo" ? "NGO" : safeUser?.role === "ddmo" ? "DDMO Official" : "User"}</span>
              </div>
              <ChevronDown
                className={`profile-arrow ${isProfileOpen ? "open" : ""}`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            <div className={`profile-dropdown ${isProfileOpen ? "open" : ""}`}>
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {safeUser?.avatar ? (
                    <img
                      src={safeUser.avatar}
                      alt="Profile"
                      className="dropdown-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="dropdown-avatar-fallback"
                    style={{
                      display: safeUser?.avatar ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#e2e8f0',
                      color: '#64748b',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}
                  >
                    {safeUser?.name?.charAt(0)?.toUpperCase() || <User className="dropdown-avatar-icon" />}
                  </div>
                </div>
                <div className="dropdown-user-info">
                  <p className="dropdown-name">{safeUser?.name || "User"}</p>
                  <p className="dropdown-email">{safeUser?.email || "No email provided"}</p>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={handleProfile}>
                  <User className="dropdown-icon" />
                  <span>Profile Settings</span>
                </button>
                <button className="dropdown-item">
                  <Settings className="dropdown-icon" />
                  <span>Preferences</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut className="dropdown-icon" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? (
              <X className="menu-icon" />
            ) : (
              <Menu className="menu-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-content">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <item.icon className="mobile-nav-icon" />
              <span className="mobile-nav-text">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default UserDashboardNavbar;
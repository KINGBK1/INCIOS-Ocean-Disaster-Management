import React, { useState, useRef, useEffect } from 'react';
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
  Cookie
} from 'lucide-react';
import './UserDashboardNav.css';
import cookie from 'js-cookie';



const UserDashboardNavbar = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const profileRef = useRef(null);

  // Fallback user data
  const safeUser = user || { 
    name: "Guest User", 
    email: "guest@example.com", 
    avatar: null 
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

const handleLogout = () => {

  cookie.remove('token');

  window.location.href = '/signin';
};

  const handleProfile = () => {
    console.log('Navigate to profile...');
    setIsProfileOpen(false);
  };

  const clearNotifications = () => {
    setNotifications(0);
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, href: '/dashboard', active: true },
    { name: 'Live Map', icon: Map, href: '/map' },
    { name: 'Alerts', icon: AlertTriangle, href: '/alerts' },
    { name: 'Reports', icon: MessageSquare, href: '/reports' },
    { name: 'Analytics', icon: Activity, href: '/analytics' },
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
            <h1 className="brand-title">INCOIS</h1>
            <span className="brand-subtitle">Disaster Management</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" />
              <span className="nav-text">{item.name}</span>
            </a>
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
                  <img src={safeUser.avatar} alt="Profile" className="avatar-img" />
                ) : (
                  <User className="avatar-icon" />
                )}
              </div>
              <div className="profile-info">
                <span className="profile-name">{safeUser?.name}</span>
                <span className="profile-role">Administrator</span>
              </div>
              <ChevronDown className={`profile-arrow ${isProfileOpen ? 'open' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {safeUser?.avatar ? (
                    <img src={safeUser.avatar} alt="Profile" className="dropdown-avatar-img" />
                  ) : (
                    <User className="dropdown-avatar-icon" />
                  )}
                </div>
                <div className="dropdown-user-info">
                  <p className="dropdown-name">{safeUser?.name}</p>
                  <p className="dropdown-email">{safeUser?.email}</p>
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
            {isMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`mobile-nav-item ${item.active ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <item.icon className="mobile-nav-icon" />
              <span className="mobile-nav-text">{item.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="mobile-overlay" onClick={() => setIsMenuOpen(false)}></div>}
    </nav>
  );
};

export default UserDashboardNavbar;

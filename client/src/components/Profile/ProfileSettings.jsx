import React, { useState, useContext, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Lock, 
  Bell, 
  Shield, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Settings,
  Globe,
  Smartphone,
  Key,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Auth/context/AuthContext';
import UserDashboardNavbar from '../Dashboard/Navbar/UserDashboardNav';
import Cookies from 'js-cookie';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('personal');
  
  // State for form data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatar: user?.avatar || null
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: user?.preferences?.emailAlerts ?? true,
    smsAlerts: user?.preferences?.smsAlerts ?? false,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    weatherAlerts: user?.preferences?.weatherAlerts ?? true,
    emergencyAlerts: user?.preferences?.emergencyAlerts ?? true
  });
  
  // UI State
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'File size should be less than 5MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
        setFormData(prev => ({
          ...prev,
          avatar: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const token = Cookies.get('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
        credentials: 'include'
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        showMessage('success', 'Profile updated successfully!');
        setAvatarPreview(null);
      } else {
        showMessage('error', 'Failed to update profile');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password should be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: 'include'
      });

      if (response.ok) {
        showMessage('success', 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Failed to change password');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while changing password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences: notifications }),
        credentials: 'include'
      });

      if (response.ok) {
        showMessage('success', 'Notification preferences updated!');
      } else {
        showMessage('error', 'Failed to update preferences');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while updating preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        showMessage('success', 'Account deleted successfully!');
        // Clear auth data and redirect
        Cookies.remove('token');
        updateUser(null);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Failed to delete account');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while deleting account');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  return (
    <div className="profile-settings-container">
      <nav>
        <UserDashboardNavbar user={user} />
      </nav>
      
      <div className="profile-content">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="profile-title">Profile Settings</h1>
          <p className="profile-subtitle">Manage your account settings and preferences</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="sidebar-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {activeTab === 'personal' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Personal Information</h2>
                  <p>Update your personal details and profile picture</p>
                </div>
                
                <form onSubmit={handlePersonalInfoSubmit} className="profile-form">
                  {/* Avatar Section */}
                  <div className="avatar-section">
                    <div className="avatar-container">
                      <div className="current-avatar">
                        {avatarPreview || formData.avatar ? (
                          <img 
                            src={avatarPreview || formData.avatar} 
                            alt="Profile" 
                            className="avatar-img"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="avatar-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera size={16} />
                        Change Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden-input"
                      />
                    </div>
                    <div className="avatar-info">
                      <p>Choose a profile picture. Recommended size: 400x400px</p>
                      <small>Maximum file size: 5MB</small>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <div className="input-with-icon">
                        <User size={20} />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <div className="input-with-icon">
                        <Mail size={20} />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <div className="input-with-icon">
                        <Phone size={20} />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <div className="input-with-icon">
                        <MapPin size={20} />
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isLoading}>
                      <Save size={20} />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Security Settings</h2>
                  <p>Manage your password and security preferences</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="input-with-icon">
                      <Lock size={20} />
                      <input
                        type={showPassword.current ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(prev => ({...prev, current: !prev.current}))}
                      >
                        {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="input-with-icon">
                      <Key size={20} />
                      <input
                        type={showPassword.new ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(prev => ({...prev, new: !prev.new}))}
                      >
                        {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="input-with-icon">
                      <Key size={20} />
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(prev => ({...prev, confirm: !prev.confirm}))}
                      >
                        {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isLoading}>
                      <Save size={20} />
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p>Choose how you want to receive alerts and updates</p>
                </div>

                <form onSubmit={handleNotificationsSubmit} className="profile-form">
                  <div className="notification-settings">
                    <div className="notification-group">
                      <h3>Alert Notifications</h3>
                      
                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="notification-icon">
                            <Mail size={20} />
                          </div>
                          <div>
                            <h4>Email Alerts</h4>
                            <p>Receive disaster and weather alerts via email</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="emailAlerts"
                            checked={notifications.emailAlerts}
                            onChange={handleNotificationChange}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="notification-icon">
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <h4>SMS Alerts</h4>
                            <p>Receive urgent alerts via SMS</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="smsAlerts"
                            checked={notifications.smsAlerts}
                            onChange={handleNotificationChange}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="notification-icon">
                            <Bell size={20} />
                          </div>
                          <div>
                            <h4>Push Notifications</h4>
                            <p>Receive push notifications in your browser</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="pushNotifications"
                            checked={notifications.pushNotifications}
                            onChange={handleNotificationChange}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="notification-group">
                      <h3>Alert Types</h3>
                      
                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="notification-icon">
                            <Globe size={20} />
                          </div>
                          <div>
                            <h4>Weather Alerts</h4>
                            <p>Get notified about weather-related disasters</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="weatherAlerts"
                            checked={notifications.weatherAlerts}
                            onChange={handleNotificationChange}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="notification-icon">
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <h4>Emergency Alerts</h4>
                            <p>Critical emergency notifications (always enabled)</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="emergencyAlerts"
                            checked={notifications.emergencyAlerts}
                            onChange={handleNotificationChange}
                            disabled
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isLoading}>
                      <Save size={20} />
                      {isLoading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Account Management</h2>
                  <p>Manage your account settings and data</p>
                </div>

                <div className="account-sections">
                  <div className="account-section">
                    <h3>Account Information</h3>
                    <div className="account-info">
                      <div className="info-item">
                        <span className="info-label">Account Type:</span>
                        <span className="info-value">{user?.role || 'User'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Member Since:</span>
                        <span className="info-value">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Last Login:</span>
                        <span className="info-value">
                          {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="account-section danger-zone">
                    <h3>Danger Zone</h3>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="delete-btn" onClick={handleDeleteAccount} disabled={isLoading}>
                      <Trash2 size={20} />
                      {isLoading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
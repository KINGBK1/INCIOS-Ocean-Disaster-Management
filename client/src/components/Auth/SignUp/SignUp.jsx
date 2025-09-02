import React, { useState } from 'react';
import { User, Shield, Building, MapPin, Check, AlertTriangle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
// import jwt_decode from "jwt-decode";
import axios from 'axios';
import './SignUp.css';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

// const jwt_decode = (await import('jwt-decode')).default;

const SignUpPage = () => {

  const navigate = useNavigate();
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    adminId: '',
    ngoId: '',
    ddmoId: '',
    username: '',
    password: '',
    confirmPassword: '',
    location: '',
    termsAccepted: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const userTypes = [
    { value: 'admin', label: 'Admin', icon: Shield, color: 'admin-gradient' },
    { value: 'ngo', label: 'NGO', icon: Building, color: 'ngo-gradient' },
    { value: 'ddmo', label: 'DDMO Official', icon: AlertTriangle, color: 'ddmo-gradient' },
    { value: 'user', label: 'Regular User', icon: User, color: 'user-gradient' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    try {
      const payload = {
        role: userType,
        username: formData.username || `${userType}_${Date.now()}`,
        password: formData.password || undefined,
        location: formData.location,
        adminId: formData.adminId || undefined,
        ngoId: formData.ngoId || undefined,
        ddmoId: formData.ddmoId || undefined,
      };

      const res = await axios.post("http://localhost:7000/api/auth/register", payload);

      alert(res.data.message || "Account created successfully!");
      console.log("Registered:", res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error creating account.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google-login`, {
        token: credentialResponse.credential,
      });

      // Store token in cookie (expires in 7 days)
      Cookies.set('token', res.data.token, { expires: 7, path: '/' });

      // alert("Google login success!");

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Google login failed!");
    }
  };


  const renderSpecificFields = () => {
    switch (userType) {
      case 'admin':
        return (
          <div className="form-section">
            <div className="input-container">
              <Shield className="input-icon admin-color" />
              <input
                type="text"
                name="adminId"
                value={formData.adminId}
                onChange={handleInputChange}
                placeholder="Admin ID"
                className="form-input admin-focus"
              />
            </div>
          </div>
        );
      case 'ngo':
        return (
          <div className="form-section">
            <div className="input-container">
              <Building className="input-icon ngo-color" />
              <input
                type="text"
                name="ngoId"
                value={formData.ngoId}
                onChange={handleInputChange}
                placeholder="NGO ID"
                className="form-input ngo-focus"
              />
            </div>
          </div>
        );
      case 'ddmo':
        return (
          <div className="form-section">
            <div className="input-container">
              <AlertTriangle className="input-icon ddmo-color" />
              <input
                type="text"
                name="ddmoId"
                value={formData.ddmoId}
                onChange={handleInputChange}
                placeholder="DDMO Official ID"
                className="form-input ddmo-focus"
              />
            </div>
          </div>
        );
      case 'user':
        return (
          <div className="form-section">
            <div className="input-container">
              <User className="input-icon user-color" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="form-input user-focus"
              />
            </div>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="form-input user-focus"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="input-container">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm Password"
                className="form-input user-focus"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isFormValid = () => {
    if (!userType || !formData.location || !formData.termsAccepted) return false;
    
    switch (userType) {
      case 'admin': return formData.adminId.trim() !== '';
      case 'ngo': return formData.ngoId.trim() !== '';
      case 'ddmo': return formData.ddmoId.trim() !== '';
      case 'user': 
        return formData.username.trim() !== '' && 
               formData.password !== '' && 
               formData.confirmPassword !== '' &&
               formData.password === formData.confirmPassword;
      default: return false;
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="card-content">
          <h1 className="title">INCIOS Disaster Management System</h1>
          <p className="subtitle">Disaster Management System</p>

          <div className="form-container">
            {/* User Type Selection */}
            <div className="user-type-section">
              <label className="section-label">Choose Your Role</label>
              <div className="user-type-grid">
                {userTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setUserType(type.value)}
                      className={`user-type-button ${userType === type.value ? 'active' : ''} ${type.color}`}
                    >
                      <div className="button-content">
                        <IconComponent className="button-icon" />
                        <span className="button-label">{type.label}</span>
                      </div>
                      {userType === type.value && (
                        <div className="selection-indicator">
                          <Check className="check-icon" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Form Fields */}
            {userType && renderSpecificFields()}

            {/* Google OAuth - only for regular users */}
            {userType === 'user' && (
              <div className="oauth-section">
                <div className="divider">
                  <span className="divider-text">or continue with</span>
                </div>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Google login failed")}
                />
              </div>
            )}

            {/* Location Field */}
            {/* <p>Selected Role: {userType || 'None'}</p> */}
            {userType && (
              <div className="form-section">
                <div className="input-container">
                  <MapPin className="input-icon location-color" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter your location"
                    className="form-input location-focus"
                  />
                </div>
              </div>
            )}

            {/* Terms */}
            {userType && (
              <div className="form-section">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                  />
                  <span>I agree to the Terms and Conditions</span>
                </label>
              </div>
            )}

            {/* Submit */}
            {userType && (
              <div className="form-section">
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid()}
                  className={`submit-button ${isFormValid() ? 'enabled' : 'disabled'}`}
                >
                  Create Account →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

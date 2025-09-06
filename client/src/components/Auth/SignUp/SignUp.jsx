import React, { useState, useEffect, useContext } from "react";
import {
  User,
  Shield,
  Building,
  MapPin,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Briefcase,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./SignUp.css"; // The new CSS file will be much more extensive
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Auth/context/AuthContext";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({
    entityId: "",
    username: "",
    password: "",
    confirmPassword: "",
    location: "",
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const userTypes = [
    { value: "admin", label: "Admin", icon: Shield, color: "admin" },
    { value: "ngo", label: "NGO", icon: Building, color: "ngo" },
    { value: "ddmo", label: "DDMO Official", icon: Briefcase, color: "ddmo" },
    { value: "user", label: "General User", icon: User, color: "user" },
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(
              4
            )}, ${position.coords.longitude.toFixed(4)}`,
          }));
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Don't show an alert here, just handle the state
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear password error on change
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match.");
      }
      return;
    }
    if (!navigator.cookieEnabled) {
      alert("Please enable cookies in your browser to continue.");
      return;
    }
    if (!formData.location) {
      alert("Please allow location access to continue.");
      return;
    }

    try {
      const payload = {
        role: userType,
        username:
          userType === "user" ? formData.username : `${userType}_${Date.now()}`,
        password: userType === "user" ? formData.password : undefined,
        location: formData.location,
        [`${userType}Id`]: formData.entityId || undefined,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        payload
      );

      alert(res.data.message || "Account created successfully!");
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error creating account.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/google-login`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login error:", err.response?.data || err.message);
      alert(
        `Google login failed: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const renderSpecificFields = () => {
    const isUser = userType === "user";
    const entityIdPlaceholder = {
      admin: "Admin ID",
      ngo: "NGO ID",
      ddmo: "DDMO Official ID",
    }[userType];

    return (
      <div className="form__section">
        {!isUser && (
          <div className="input__container">
            <label htmlFor="entityId" className="input__label">
              {entityIdPlaceholder}
            </label>
            <div className="input__wrapper">
              <input
                id="entityId"
                type="text"
                name="entityId"
                value={formData.entityId}
                onChange={handleInputChange}
                placeholder={entityIdPlaceholder}
                className="input__field"
              />
              <span className={`input__icon ${userType}`}>
                {userTypes.find((t) => t.value === userType)?.icon &&
                  React.createElement(
                    userTypes.find((t) => t.value === userType).icon,
                    { size: 20 }
                  )}
              </span>
            </div>
          </div>
        )}
        {isUser && (
          <>
            <div className="input__container">
              <label htmlFor="username" className="input__label">
                Username
              </label>
              <div className="input__wrapper">
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  className="input__field"
                />
                <User size={20} className="input__icon user" />
              </div>
            </div>
            <div className="input__container">
              <label htmlFor="password" className="input__label">
                Password
              </label>
              <div className="input__wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a strong password"
                  className="input__field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input__password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="input__container">
              <label htmlFor="confirmPassword" className="input__label">
                Confirm Password
              </label>
              <div className="input__wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className="input__field"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="input__password-toggle"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
            {passwordError && <p className="form__error">{passwordError}</p>}
          </>
        )}
      </div>
    );
  };

  const isFormValid = () => {
    if (!userType || !formData.termsAccepted) return false;
    if (userType !== "user" && formData.entityId.trim() === "") return false;
    if (userType === "user") {
      if (
        formData.username.trim() === "" ||
        formData.password.length < 8 ||
        formData.password !== formData.confirmPassword
      ) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="page__wrapper">
      <div className="signup-layout">
        {/* Left Side: Visuals & Mission Statement */}
        <div className="signup-layout__visuals">
          <div className="brand__logo-container">
            <Shield size={40} className="brand__logo" />
            <h2 className="brand__name">INCIOS</h2>
          </div>
          <div className="visuals__content">
            <h1 className="visuals__title">Welcome to INCIOS</h1>
            <p className="visuals__text">
              A unified platform for effective disaster management and response.
              Join us in building a resilient nation.
            </p>
          </div>
          <img
            src="https://img.freepik.com/premium-photo/people-using-technology-prepare-emergencies-disaster-management-generative-ai_1211754-1065.jpg"
            alt="Disaster Management"
            className="visuals__image"
          />
        </div>

        {/* Right Side: Sign-up Form */}
        <div className="signup-layout__form-container">
          <div className="form__header">
            <h2 className="form__title">Create Your Account</h2>
            <p className="form__subtitle">
              {!userType && "Choose your role to get started."}
              {userType === "admin" && "Fill in your Admin details below."}
              {userType === "ngo" &&
                "Provide your NGO credentials to continue."}
              {userType === "ddmo" && "Enter your DDMO Official information."}
              {userType === "user" && "Set up your General User account."}
            </p>
          </div>
          <div className="form__main">
            {/* User Type Selection */}
            <div className="form__section user-type-grid">
              {userTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setUserType(type.value);
                      setFormData((prev) => ({
                        ...prev,
                        entityId: "",
                        username: "",
                        password: "",
                        confirmPassword: "",
                      }));
                      setPasswordError("");
                    }}
                    className={`user-type__button ${
                      userType === type.value ? "is-active" : ""
                    }`}
                  >
                    <IconComponent
                      className={`user-type__icon ${type.color}`}
                    />
                    <span className="user-type__label">{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Form Fields */}
            {userType && renderSpecificFields()}

            {/* Google OAuth - only for regular users */}
            {userType === "user" && (
              <div className="oauth-section">
                <div class="divider-container">
                  <div class="line"></div>
                  <span class="divider-text">or continue with</span>
                  <div class="line"></div>
                </div>
                <div className="google-btn-wrapper">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => alert("Google login failed")}
                  />
                </div>
              </div>
            )}

            {/* Location & Terms */}
            {userType && (
              <>
                <div className="form__section">
                  <label htmlFor="location" className="input__label">
                    Your Location
                  </label>
                  <div className="input__wrapper">
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Retrieving your location..."
                      className="input__field"
                      disabled
                    />
                    <MapPin size={20} className="input__icon location" />
                  </div>
                  <p className="form__helper-text">
                    Your location is used to connect you with relevant local
                    resources.
                  </p>
                </div>

                <div className="form__section form__terms">
                  <label className="checkbox__container">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                    />
                    <span>
                      I agree to the{" "}
                      <Link to="/terms" className="link--inline">
                        Terms and Conditions
                      </Link>
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="form__section form__actions">
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid()}
                    className={`button button--primary ${
                      !isFormValid() ? "is-disabled" : ""
                    }`}
                  >
                    Create Account →
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Already a user */}
          <div className="form__footer">
            <span>Already have an account? </span>
            <Link to="/signin" className="link--inline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";
import "./SignIn.css";

const SignInPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // 🔹 auto-redirect if already logged in
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // submit handler
  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      alert("Please enter username and password");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        username: formData.username,
        password: formData.password,
      });

      // save token
      Cookies.set("token", res.data.token, { expires: 7, path: "/" });
      navigate("/dashboard");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // google login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google-login`, {
        token: credentialResponse.credential,
      });

      Cookies.set("token", res.data.token, { expires: 7, path: "/" });
      navigate("/dashboard");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Google login failed");
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h1 className="title">Sign In</h1>
        <p className="subtitle">Welcome back to INCIOS Disaster Management</p>

        <div className="form-section">
          <div className="input-container">
            <User className="input-icon" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="input-container">
            <Lock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button onClick={handleSubmit} className="submit-button">
          Sign In →
        </button>

        {/* google login */}
        <div className="oauth-section">
          <div className="divider">
            <span>or continue with</span>
          </div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google login failed")}
          />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;

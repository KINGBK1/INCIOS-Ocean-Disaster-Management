import React, { useState, useContext } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Shield, Briefcase } from "lucide-react";
import { AuthContext } from "../../Auth/context/AuthContext";
import "./SignIn.css";

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      showMessage("Please enter username and password.", "error");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        username: formData.username,
        password: formData.password,
      });
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err.response?.data || err.message);
      showMessage(err.response?.data?.message || "Login failed.", "error");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google-login`, {
        token: credentialResponse.credential,
      });
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login error:", err.response?.data || err.message);
      showMessage("Google login failed.", "error");
    }
  };

  const handleGoogleError = (errorResponse) => {
    console.error("Google login error:", errorResponse);
    showMessage("Google login failed.", "error");
  };

  return (
    <div className="page__wrapper">
      <div className="signin-layout">
        <div className="signin-layout__visuals">
          <div className="brand__logo-container">
            <Shield size={40} className="brand__logo" />
            <h2 className="brand__name">INCIOS</h2>
          </div>
          <div className="visuals__content">
            <h1 className="visuals__title">Welcome back to INCIOS</h1>
            <p className="visuals__text">
              A unified platform for effective disaster management and response.
              Join us in building a resilient nation.
            </p>
            
          </div>
        </div>

        <div className="signin-layout__form-container">
          <div className="form__header">
            <h2 className="form__title">Sign In to your account</h2>
            <p className="form__subtitle">
              Welcome back. Please enter your details.
            </p>
          </div>
          <div className="form__main">
            {message && <div className={`message-box message-box--${messageType}`}>{message}</div>}
            <div className="form__section">
              <div className="input__container">
                <label htmlFor="username" className="input__label">
                  Username
                </label>
                <div className="input__wrapper">
                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input__field"
                  />
                  <User size={20} className="input__icon" />
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
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
            </div>

            <div className="form__section form__actions">
              <button onClick={handleSubmit} className="button button--primary">
                Sign In →
              </button>
            </div>

            <div className="oauth-section">
              <div className="divider">
                <span className="divider__text">or continue with</span>
              </div>
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </div>
            </div>
          </div>

          <div className="form__footer">
            <span>New user? </span>
            <Link to="/signup" className="link--inline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
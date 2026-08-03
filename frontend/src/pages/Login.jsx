import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "../assets/styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(email, password);

      if (res.success) {
        // Use new auth context login
        login(res.user, res.token);
        toast.success(`Welcome ${res.user.name}!`);
        navigate("/dashboard");
      } else {
        toast.error("Invalid Credentials");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <i className="bi bi-building"></i>
          </div>
          <h1 className="logo-title">VRN INC.</h1>
          <p className="logo-subtitle">Sales Leads CRM</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Email Input */}
          <div className="input-group">
            <label htmlFor="email">
              <i className="bi bi-envelope-fill"></i>
              Email Address
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
              <span className="input-focus-effect"></span>
            </div>
          </div>

          {/* Password Input */}
          <div className="input-group">
            <label htmlFor="password">
              <i className="bi bi-lock-fill"></i>
              Password
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
              </button>
              <span className="input-focus-effect"></span>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Signing In...
              </span>
            ) : (
              <span className="btn-content">
                <i className="bi bi-box-arrow-in-right"></i>
                Sign In
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Full Screen Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h3>Logging In...</h3>
            <p>Please wait while we verify your credentials</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
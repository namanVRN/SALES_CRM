import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, logout as logoutApi, setAuthToken } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData, token) => {
    setAuthToken(token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Logout function
  const handleLogout = () => {
    logoutApi();
    setUser(null);
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // Check module access
const hasModuleAccess = (module) => {
  if (!user) return false;
  if (user.role === "admin" || user.assignedModule === "all") return true;
  if (user.assignedModule === "fsr" && module === "fsr") return true;
  return user.assignedModule === module;
};

  const value = {
    user,
    loading,
    login,
    logout: handleLogout,
    hasModuleAccess,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
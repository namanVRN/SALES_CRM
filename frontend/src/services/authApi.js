import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// ============================================
// Login User
// ============================================
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

// ============================================
// Verify Token
// ============================================
export const verifyToken = async (token) => {
  const response = await axios.get(`${API_BASE}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ============================================
// Set Token in Axios Headers
// ============================================
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("authToken", token);
  } else {
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("authToken");
  }
};

// ============================================
// Get Current User from localStorage
// ============================================
export const getCurrentUser = () => {
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    setAuthToken(token);
    return JSON.parse(userStr);
  }
  return null;
};

// ============================================
// Logout - Clear All Data
// ============================================
export const logout = () => {
  setAuthToken(null);
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
};

// ============================================
// Check Module Access
// ============================================
export const hasModuleAccess = (user, module) => {
  if (!user) return false;
  if (user.role === "admin" || user.assignedModule === "all") return true;
  return user.assignedModule === module;
};
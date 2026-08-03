import axios from "axios";

// Apps Script wala (purana - login ke liye)
const API_URL = import.meta.env.VITE_API_URL_USER;

export const login = async (email, password) => {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email,
      password,
    }),
  });
  return res.json();
};

// ✅ Node backend axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

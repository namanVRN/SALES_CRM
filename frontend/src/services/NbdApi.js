import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// ✅ Helper: Get auth token for API calls
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
});

// ============================================
// NBDIN API Functions
// ============================================

// Fetch NBDIN Data — ✅ Now sends auth token for doer-based filtering
export const fetchNBDINData = async () => {
  const response = await axios.get(`${API_BASE}/leads/nbdin`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update NBDIN Lead
export const updateNBDINLead = async (data) => {
  const response = await axios.post(`${API_BASE}/leads/nbdin/update`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ✅ NEW: Assign Lead to BDM
export const assignNBDINLead = async (data) => {
  const response = await axios.post(`${API_BASE}/leads/nbdin/assign`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ============================================
// FIELD VISIT API Functions
// ============================================

// Fetch Field Visit Data
export const fetchFieldVisitData = async () => {
  const response = await axios.get(`${API_BASE}/field-visit/list`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update Field Visit Lead
export const updateFieldVisitLead = async (data) => {
  const response = await axios.post(`${API_BASE}/field-visit/update`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ============================================
// AFTER FIELD VISIT API Functions
// ============================================

// Fetch After Field Visit Data
export const fetchAfterFieldVisitData = async () => {
  const response = await axios.get(`${API_BASE}/after-field-visit/list`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update After Field Visit Lead
export const updateAfterFieldVisitLead = async (data) => {
  const response = await axios.post(`${API_BASE}/after-field-visit/update`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ============================================
// MEETING NBD API Functions
// ============================================

// Fetch Meeting NBD Data
export const fetchMeetingNbdData = async () => {
  const response = await axios.get(`${API_BASE}/meeting-nbd/list`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update Meeting NBD Lead
export const updateMeetingNbdLead = async (data) => {
  const response = await axios.post(`${API_BASE}/meeting-nbd/update`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ============================================
// BOOKING NBD API Functions
// ============================================

// Fetch Booking NBD Data
export const fetchBookingNbdData = async () => {
  const response = await axios.get(`${API_BASE}/booking-nbd/list`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update Booking NBD Lead
export const updateBookingNbdLead = async (data) => {
  const response = await axios.post(`${API_BASE}/booking-nbd/update`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ============================================
// CNP (Call Not Picked) API Functions
// ============================================

export const fetchCNPData = async () => {
  const response = await axios.get(`${API_BASE}/cnp/list`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateCNPLead = async (data) => {
  const response = await axios.post(`${API_BASE}/cnp/update`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ============================================
// UNIVERSAL LEAD SEARCH API Functions
// ============================================

// Search Leads (by name, contact, or unique ID)
export const searchLeads = async (searchTerm) => {
  const response = await api.get(`/leads/search?q=${encodeURIComponent(searchTerm)}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get Lead by Unique ID
export const getLeadByUniqueId = async (uniqueId) => {
  const response = await api.get(`/leads/lead/${encodeURIComponent(uniqueId)}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Export the axios instance for potential future use
export { api };

export default {
  // NBDIN
  fetchNBDINData,
  updateNBDINLead,
  assignNBDINLead,

  // Field Visit
  fetchFieldVisitData,
  updateFieldVisitLead,

  // After Field Visit
  fetchAfterFieldVisitData,
  updateAfterFieldVisitLead,

  // Meeting NBD
  fetchMeetingNbdData,
  updateMeetingNbdLead,

  // Booking NBD
  fetchBookingNbdData,
  updateBookingNbdLead,

  // Universal Search
  searchLeads,
  getLeadByUniqueId,
  
  // CNP
  fetchCNPData,
  updateCNPLead,
};
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;


const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});


export const fetchCPLeadFormData = async () => {
  const response = await api.get("/cp/lead-form/list");
  return response.data;
};

// Update CP Lead Form Data
export const updateCPLeadFormData = async (data) => {
   const response = await api.post("/cp/lead-form/update", data);
  return response.data;
};



// ============================================
// CP Follow-up APIs
// ============================================

// Can Contact
export const fetchCPCanContactFollowup = async () => {
  const response = await axios.get(`${API_BASE}/cp/followup/can-contact/list`);
  return response.data;
};

export const updateCPCanContactFollowup = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/followup/can-contact/update`, data);
  return response.data;
};

// Cannot Contact
export const fetchCPCannotContactFollowup = async () => {
  const response = await axios.get(`${API_BASE}/cp/followup/cannot-contact/list`);
  return response.data;
};

export const updateCPCannotContactFollowup = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/followup/cannot-contact/update`, data);
  return response.data;
};

// ============================================
// CP Field Visit APIs
// ============================================

export const fetchCPCanContactFieldVisit = async () => {
  const response = await axios.get(`${API_BASE}/cp/field-visit/can-contact/list`);
  return response.data;
};

export const updateCPCanContactFieldVisit = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/field-visit/can-contact/update`, data);
  return response.data;
};

export const fetchCPCannotContactFieldVisit = async () => {
  const response = await axios.get(`${API_BASE}/cp/field-visit/cannot-contact/list`);
  return response.data;
};

export const updateCPCannotContactFieldVisit = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/field-visit/cannot-contact/update`, data);
  return response.data;
};

// ============================================
// CP After Field Visit APIs
// ============================================

export const fetchCPCanContactAfterFV = async () => {
  const response = await axios.get(`${API_BASE}/cp/after-field-visit/can-contact/list`);
  return response.data;
};

export const updateCPCanContactAfterFV = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/after-field-visit/can-contact/update`, data);
  return response.data;
};

export const fetchCPCannotContactAfterFV = async () => {
  const response = await axios.get(`${API_BASE}/cp/after-field-visit/cannot-contact/list`);
  return response.data;
};

export const updateCPCannotContactAfterFV = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/after-field-visit/cannot-contact/update`, data);
  return response.data;
};

// ============================================
// CP Meeting APIs
// ============================================

export const fetchCPCanContactMeeting = async () => {
  const response = await axios.get(`${API_BASE}/cp/meeting/can-contact/list`);
  return response.data;
};

export const updateCPCanContactMeeting = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/meeting/can-contact/update`, data);
  return response.data;
};

export const fetchCPCannotContactMeeting = async () => {
  const response = await axios.get(`${API_BASE}/cp/meeting/cannot-contact/list`);
  return response.data;
};

export const updateCPCannotContactMeeting = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/meeting/cannot-contact/update`, data);
  return response.data;
};

// ============================================
// CP Booking APIs
// ============================================

export const fetchCPCanContactBooking = async () => {
  const response = await axios.get(`${API_BASE}/cp/booking/can-contact/list`);
  return response.data;
};

export const updateCPCanContactBooking = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/booking/can-contact/update`, data);
  return response.data;
};

export const fetchCPCannotContactBooking = async () => {
  const response = await axios.get(`${API_BASE}/cp/booking/cannot-contact/list`);
  return response.data;
};

export const updateCPCannotContactBooking = async (data) => {
  const response = await axios.post(`${API_BASE}/cp/booking/cannot-contact/update`, data);
  return response.data;
};

export default api;

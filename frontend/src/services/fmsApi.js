const API_BASE =
  import.meta.env.VITE_API_BASE ;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ✅ Step 1: Call to Broker — GET list
export const fetchCallToBrokerData = async () => {
  const res = await fetch(`${API_BASE}/call-to-broker/list`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch Call to Broker data");
  return res.json();
};

// ✅ Step 1: Call to Broker — POST update
export const submitCallToBrokerAction = async (payload) => {
  const res = await fetch(`${API_BASE}/call-to-broker/update`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
};

// ============================================
// Below functions kept for future migration
// ============================================

const API_URL = import.meta.env.VITE_API_URL;

const buildParams = (baseParams = {}, filterParams = {}) => {
  const params = new URLSearchParams(baseParams);
  if (filterParams?.fromDate) params.append("fromDate", filterParams.fromDate);
  if (filterParams?.toDate) params.append("toDate", filterParams.toDate);
  if (filterParams?.status) params.append("status", filterParams.status);
  if (filterParams?.leadQualified)
    params.append("leadQualified", filterParams.leadQualified);
  return params.toString();
};

// Step 2: Followup (still on AppScript)
export const fetchFollowupData = async ({ fromDate, toDate, status } = {}) => {
  const query = buildParams(
    { action: "fetchFollowup" },
    { fromDate, toDate, status },
  );
  const res = await fetch(`${API_URL}?${query}`);
  return res.json();
};

export const submitFollowupAction = async (payload) => {
  const params = new URLSearchParams({
    action: "updateFollowup",
    rowNumber: payload.rowNumber,
    status: payload.status || "",
    contactPerson: payload.contactPerson || "",
    rera: payload.rera || "",
    remark: payload.remark || "",
    days: payload.days || "",
  });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
};

export const getPendingFollowups = async () => {
  const params = new URLSearchParams({ action: "getPendingFollowups" });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
};

export const getPendingNextFollowups = async () => {
  const params = new URLSearchParams({ action: "getPendingNextFollowups" });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
};

export const createFollowups = async (followupsArray) => {
  const params = new URLSearchParams({
    action: "createFollowups",
    followups: JSON.stringify(followupsArray),
  });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
};

export const getHolidays = async () => {
  const params = new URLSearchParams({ action: "getHolidays" });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
};

export const fetchNBDINData = async () => {
  console.log("fetchNBDINData call hui - no params needed");
  try {
    const response = await axios.get(
      "http://localhost:5000/api/fetch-follow-before-field-visit",
    );
    console.log("API response mila:", response.data);
    return response;
  } catch (error) {
    console.error("API call fail:", error.message);
    throw error;
  }
};



import api from "./api"; // your axios instance with baseURL

// ----- Full Kitting -----
export const fetchFullKittingData = async ({
  fromDate,
  toDate,
  status,
} = {}) => {
  const res = await api.get("/meetings/full-kitting", {
    params: { fromDate, toDate, status },
  });
  return res.data;
};

export const submitFullKittingAction = async (payload) => {
  const res = await api.post("/meetings/full-kitting/action", payload);
  return res.data;
};

// ----- Meetings -----
export const fetchMeetingsSub = async ({ status } = {}) => {
  const res = await api.get("/meetings/meetings-sub", { params: { status } });
  return res.data;
};

export const submitMeetingsSubAction = async (payload) => {
  const res = await api.post("/meetings/meetings-sub/action", payload);
  return res.data;
};

// ----- Agreement (with PDF) -----
export const fetchAgreementData = async ({ fromDate, toDate, status } = {}) => {
  const res = await api.get("/meetings/agreement", {
    params: { fromDate, toDate, status },
  });
  return res.data;
};

export const submitAgreementAction = async (payload) => {
  const formData = new FormData();

  formData.append("rowNumber", String(payload.rowNumber));
  formData.append("status", payload.status);
  formData.append("dealsIn", payload.dealsIn || "");
  formData.append("contactInOffice", payload.contactInOffice || "");
  formData.append("remark", payload.remark || "");
  formData.append("nextPlannedDate", payload.nextPlannedDate || ""); 
  formData.append("leadInfo", JSON.stringify(payload.leadInfo || {}));
  formData.append("notInterestedReason", payload.notInterestedReason || "");

  // ✅ Sirf actual File object hone par append karo
  if (payload.uploadPdf instanceof File) {
    formData.append("uploadPdf", payload.uploadPdf);
  }

  const res = await api.post("/meetings/agreement/action", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

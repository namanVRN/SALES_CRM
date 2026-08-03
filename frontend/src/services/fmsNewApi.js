// const NEW_API_URL = import.meta.env.VITE_NEW_API_URL;

// const buildParams = (baseParams = {}, filterParams = {}) => {
//   const params = new URLSearchParams(baseParams);

//   if (filterParams?.fromDate) params.append("fromDate", filterParams.fromDate);
//   if (filterParams?.toDate) params.append("toDate", filterParams.toDate);
//   if (filterParams?.status) params.append("status", filterParams.status);

//   return params.toString();
// };

// export const fetchFullKittingData = async ({
//   fromDate,
//   toDate,
//   status,
// } = {}) => {
//   const query = buildParams(
//     { action: "fetchFullKitting" },
//     { fromDate, toDate, status }
//   );
//   const res = await fetch(`${NEW_API_URL}?${query}`);
//   return res.json();
// };

// export const submitFullKittingAction = async (payload) => {
//   const params = new URLSearchParams({
//     action: "updateFullKitting",
//     rowNumber: payload.rowNumber,
//     status: payload.status || "",
//     pptPrint: payload.pptPrint || "",
//     slabStructure: payload.slabStructure || "",
//     remark: payload.remark || "",
//   });

//   const res = await fetch(`${NEW_API_URL}?${params.toString()}`);
//   return res.json();
// };

// export const fetchMeetingsSub = async ({ fromDate, toDate, status } = {}) => {
//   const query = buildParams(
//     { action: "fetchMeetingsSub" },
//     { fromDate, toDate, status }
//   );

//   const res = await fetch(`${NEW_API_URL}?${query}`);
//   if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
//   return res.json();
// };

// /**
//  * Submit updates from Meetings sub-step modal
//  * @param {Object} payload - Form data
//  * @returns {Promise<Object>} API response
//  */
// export const submitMeetingsSubAction = async (payload) => {
//   const params = new URLSearchParams({
//     action: "updateMeetingsSub",
//     rowNumber: payload.rowNumber,
//     status: payload.status || "",
//     channelPartnerName: payload.channelPartnerName || "",
//     reviseDate: payload.reviseDate || "",
//     reviseCount: payload.reviseCount || "",
//     remark: payload.remark || "",
//   });

//   const res = await fetch(`${NEW_API_URL}?${params.toString()}`);
//   if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
//   return res.json();
// };

// export const fetchAgreementData = async ({ fromDate, toDate, status } = {}) => {
//   const query = buildParams(
//     { action: "fetchAgreement" },
//     { fromDate, toDate, status }
//   );
//   const res = await fetch(`${NEW_API_URL}?${query}`);
//   return res.json();
// };

// export const submitAgreementAction = async (payload) => {
//   const formData = new FormData();
//   formData.append("action", "updateAgreement");
//   formData.append("rowNumber", payload.rowNumber);
//   formData.append("status", payload.status || "");
//   formData.append("dealsIn", payload.dealsIn || "");
//   formData.append("contactInOffice", payload.contactInOffice || "");
//   formData.append("remark", payload.remark || "");

//   if (payload.uploadPdf) {
//     formData.append("uploadPdf", payload.uploadPdf);
//   }

//   const res = await fetch(NEW_API_URL, {
//     method: "POST",
//     body: formData,
//   });

//   return res.json();
// };

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

// import { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { fetchCPLeadFormData, updateCPLeadFormData } from "../services/cpApi";
// import Layout from "../components/Layout";
// import SkeletonTable from "../components/SkeletonTable";
// import "../assets/styles/TablePages.css";
// import "../assets/styles/ActionModal.css";

// // ============================================
// // Constants
// // ============================================
// const STATUS_OPTIONS = [
//   "Qualified",
//   "Next Followup Required",
//   "No Connection Yet",
//   "Not Interested",
//   "Not Qualified",
// ];

// const PROJECT_OPTIONS = [
//   "Ultimate Heights",
//   "My City",
//   "Signature S 9",
//   "Signature One",
//   "Ultimate English Villas",
//   "SIGNATURE HERITAGE",
//   "Ultimate Sky Villa",
//   "Signature Paradise",
// ];

// const PURPOSE_OPTIONS = [
//   "Investment",
//   "Self Use",
//   "Rental Income",
//   "Business Purpose",
//   "Other",
// ];

// // ============================================
// // Component
// // ============================================
// function CPLeadForm() {
//   const queryClient = useQueryClient();

//   const [showModal, setShowModal] = useState(false);
//   const [selectedLead, setSelectedLead] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitSuccess, setSubmitSuccess] = useState(false);
//   const [plannedFilter, setPlannedFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD format
//   const [dateTo, setDateTo] = useState("");

//   const initialFormState = {
//     status: "",
//     projectSelection: [],
//     importantNote: "",
//     purpose: "",
//     plannedSiteVisit: "",
//     sendWhatsapp: "",
//     whatsappProject: "",
//     alternateWhatsapp: "",
//     nextFollowUp: "",
//     remarks: "",
//     notQualifiedReason: "",
//     canContact: "",
//   };

//   const isDateInRange = (plannedDateStr) => {
//     if (!plannedDateStr || !plannedDateStr.trim()) {
//       // No date → show by default unless user picked custom range
//       return !dateFrom && !dateTo;
//     }

//     // Clean string: remove time part if present, trim spaces
//     let datePart = plannedDateStr.split(" ")[0].trim();

//     // Try parsing with multiple common formats
//     let planned = null;

//     // Attempt 1: YYYY-MM-DD or DD-MM-YYYY / DD/MM/YYYY
//     const hyphenSlash = datePart.match(/^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})$/);
//     if (hyphenSlash) {
//       let [_, p1, p2, p3] = hyphenSlash;
//       let y = parseInt(p1),
//         m = parseInt(p2),
//         d = parseInt(p3);

//       // Detect format
//       if (p1.length === 4) {
//         // YYYY-MM-DD
//         planned = new Date(y, m - 1, d);
//       } else if (p3.length === 4) {
//         // DD-MM-YYYY or DD/MM/YYYY
//         planned = new Date(p3, m - 1, y);
//       } else {
//         // MM-DD-YYYY (less common but try)
//         planned = new Date(p3, y - 1, d);
//       }
//     }

//     // Attempt 2: If above failed, try Date.parse (handles "15-Mar-2025", "Mar 15 2025", etc.)
//     if (!planned || isNaN(planned.getTime())) {
//       planned = new Date(datePart);
//     }

//     // If still invalid → log and show by default (don't hide records)
//     if (isNaN(planned?.getTime())) {
//       console.warn("Could not parse plannedDate:", plannedDateStr);
//       return !dateFrom && !dateTo; // safe fallback: show
//     }

//     planned.setHours(0, 0, 0, 0);

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Quick filters (only apply if no custom range)
//     if (plannedFilter !== "all" && !dateFrom && !dateTo) {
//       if (plannedFilter === "today") {
//         return planned.toDateString() === today.toDateString();
//       }
//       if (plannedFilter === "tomorrow") {
//         const tom = new Date(today);
//         tom.setDate(today.getDate() + 1);
//         return planned.toDateString() === tom.toDateString();
//       }
//       if (plannedFilter === "overdue") {
//         return planned < today;
//       }
//       if (plannedFilter === "this-week") {
//         const end = new Date(today);
//         end.setDate(today.getDate() + (6 - today.getDay()));
//         return planned >= today && planned <= end;
//       }
//       if (plannedFilter === "next-7-days") {
//         const next = new Date(today);
//         next.setDate(today.getDate() + 7);
//         return planned >= today && planned <= next;
//       }
//     }

//     // Custom range filter
//     if (dateFrom || dateTo) {
//       const fromD = dateFrom ? new Date(dateFrom) : null;
//       const toD = dateTo ? new Date(dateTo) : null;

//       if (fromD) fromD.setHours(0, 0, 0, 0);
//       if (toD) toD.setHours(23, 59, 59, 999);

//       if (fromD && toD) return planned >= fromD && planned <= toD;
//       if (fromD) return planned >= fromD;
//       if (toD) return planned <= toD;
//     }

//     // Default: show when no active filter
//     return true;
//   };

//   const [formData, setFormData] = useState({
//     projectSelection: [],
//   });
//   const [searchTerm, setSearchTerm] = useState("");

//   // Data Fetching
//   const {
//     data: rows = [],
//     isLoading,
//     error,
//     refetch,
//   } = useQuery({
//     queryKey: ["cpLeadForm"],
//     queryFn: fetchCPLeadFormData,
//     select: (res) => res?.data || [],
//     staleTime: 1000 * 60 * 5,
//   });

//   const filteredRows = rows.filter((row) => {
//     // 1. Name search (customer or lead gen name)
//     const searchLower = searchTerm.toLowerCase().trim();
//     const nameMatch =
//       searchLower === "" || // if search is empty → show all
//       (row.customerName || "").toLowerCase().includes(searchLower) ||
//       (row.leadGenName || "").toLowerCase().includes(searchLower);

//     // 2. Date filter
//     const dateMatch = isDateInRange(row.plannedDate);

//     // Show row only if BOTH conditions are true
//     return nameMatch && dateMatch;
//   });

//   // Update Mutation
//   const updateMutation = useMutation({
//     mutationFn: updateCPLeadFormData,
//     onSuccess: () => {
//       queryClient.invalidateQueries(["cpLeadForm"]);
//       setSubmitSuccess(true);
//       setTimeout(() => {
//         handleCloseModal();
//         setSubmitSuccess(false);
//       }, 1500);
//     },
//     onError: (err) => {
//       alert(
//         `Failed to update lead: ${err.response?.data?.message || err.message}`,
//       );
//     },
//   });

//   // Effects
//   useEffect(() => {
//     if (selectedLead) {
//       setFormData(initialFormState);
//     }
//   }, [selectedLead]);

//   // Handlers
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     if (name === "status") {
//       setFormData((prev) => ({
//         ...initialFormState,
//         status: value,
//       }));
//     }

//     if (name === "sendWhatsapp" && value === "No") {
//       setFormData((prev) => ({
//         ...prev,
//         sendWhatsapp: value,
//         whatsappProject: "",
//         alternateWhatsapp: "",
//       }));
//     }
//   };

//   const validateForm = () => {
//     // Minimal check - only status is "soft-required" for button enable
//     return !!formData.status;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setIsSubmitting(true);

//     const updateData = {
//       rowIndex: selectedLead.rowIndex,
//       status: formData.status || "",
//       remarks: formData.remarks || "",
//       projectSelection: formData.projectSelection.join(", "),
//       importantNote: formData.importantNote || "",
//       purpose: formData.purpose || "",
//       plannedSiteVisit: formData.plannedSiteVisit || "",
//       sendWhatsapp: formData.sendWhatsapp || "No",
//       whatsappProject: formData.whatsappProject || "",
//       alternateWhatsapp: formData.alternateWhatsapp || "",
//       nextFollowUp: formData.nextFollowUp || "",
//       notQualifiedReason: formData.notQualifiedReason || "",
//       canContact: formData.canContact || "Yes",
//       currentFollowUpCount: selectedLead.followUpCount || 0,
//     };

//     try {
//       await updateMutation.mutateAsync(updateData);
//     } catch (err) {
//       console.error("Update failed:", err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleActionClick = (lead) => {
//     setSelectedLead(lead);
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     setSelectedLead(null);
//     setFormData(initialFormState);
//     setSubmitSuccess(false);
//   };

//   const showWhatsAppSection = [
//     "Qualified",
//     "Next Followup Required",
//     "No Connection Yet",
//   ].includes(formData.status);

//   // ============================================
//   // Render
//   // ============================================
//   return (
//     <Layout
//       breadcrumbs={[
//         { name: "CP NBD", path: "/cp" },
//         { name: "Lead Form", path: "/cp/lead-form" },
//       ]}
//     >
//       <div className="table-page-container">
//         {/* Background Elements */}
//         <div className="table-page-bg">
//           <div
//             className="table-bg-shape table-bg-shape-1"
//             style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
//           ></div>
//           <div
//             className="table-bg-shape table-bg-shape-2"
//             style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
//           ></div>
//         </div>

//         {/* Header Section */}
//         <div
//           className="table-page-header"
//           style={{
//             background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
//           }}
//         >
//           <div className="header-content">
//             <div className="header-icon">
//               <i className="bi bi-file-earmark-check-fill"></i>
//             </div>
//             <div className="header-text">
//               <h1>CP Lead Qualification</h1>
//               <p>Channel Partner lead qualification records</p>
//             </div>
//           </div>
//           <div className="header-stats">
//             <div className="stat-box">
//               <span className="stat-number">{rows.length}</span>
//               <span className="stat-label">Pending</span>
//             </div>
//           </div>
//         </div>

//         {/* Table Section */}
//         <div className="table-section">
//           {/* Filters Row - Search box ko bada aur stretch kar diya */}
//           {!isLoading && !error && rows.length > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 flexWrap: "wrap",
//                 alignItems: "center",
//                 gap: "1.25rem",
//                 margin: "1.5rem 0 1.25rem 0",
//                 padding: "0 1rem",
//               }}
//             >
//               {/* Search Box - Left + Maximum stretch */}
//               <div
//                 style={{
//                   flex: "3 1 400px", // ← 3 = zyada grow karega (stretch)
//                   minWidth: "320px", // minimum width bada
//                   maxWidth: "50%", // screen ka 50% tak ja sakta hai
//                 }}
//               >
//                 <div className="input-group shadow-sm rounded">
//                   <span className="input-group-text bg-light border-end-0">
//                     <i className="bi bi-search text-muted"></i>
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control border-start-0 border-end-0"
//                     placeholder="Search by Customer or Lead Gen Name..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     style={{
//                       width: "100%", // Full width of its container
//                       minWidth: "380px", // Minimum size (adjust as needed)
//                       maxWidth: "650px", // Maximum limit (prevents too much stretch)
//                     }}
//                   />
//                   {searchTerm && (
//                     <button
//                       className="btn btn-outline-secondary border-start-0 rounded-end"
//                       type="button"
//                       onClick={() => setSearchTerm("")}
//                       title="Clear search"
//                     >
//                       <i className="bi bi-x-lg"></i>
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Quick Filter Dropdown - Fixed size */}
//               <div
//                 style={{
//                   flex: "0 0 260px", // grow mat karo, fixed width
//                   minWidth: "220px",
//                 }}
//               >
//                 <select
//                   className="form-select shadow-sm rounded"
//                   value={plannedFilter}
//                   onChange={(e) => {
//                     setPlannedFilter(e.target.value);
//                     if (e.target.value !== "all") {
//                       setDateFrom("");
//                       setDateTo("");
//                     }
//                   }}
//                 >
//                   <option value="all">All Planned Dates</option>
//                   <option value="today">Today</option>
//                   <option value="tomorrow">Tomorrow</option>
//                   <option value="overdue">Overdue</option>
//                   <option value="this-week">This Week</option>
//                   <option value="next-7-days">Next 7 Days</option>
//                 </select>
//               </div>

//               {/* Custom Date Range - Right side, fixed size */}
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "0.75rem",
//                   flex: "0 0 380px", // fixed width, grow mat karo
//                   minWidth: "340px",
//                   justifyContent: "flex-end",
//                   flexWrap: "wrap",
//                 }}
//               >
//                 <input
//                   type="date"
//                   className="form-control shadow-sm rounded"
//                   value={dateFrom}
//                   onChange={(e) => {
//                     setDateFrom(e.target.value);
//                     setPlannedFilter("all");
//                   }}
//                   style={{ flex: "1 1 150px", minWidth: "150px" }}
//                 />
//                 <span className="text-muted fw-medium">to</span>
//                 <input
//                   type="date"
//                   className="form-control shadow-sm rounded"
//                   value={dateTo}
//                   onChange={(e) => {
//                     setDateTo(e.target.value);
//                     setPlannedFilter("all");
//                   }}
//                   style={{ flex: "1 1 150px", minWidth: "150px" }}
//                 />
//               </div>
//             </div>
//           )}
//           {isLoading ? (
//             <div className="table-loading">
//               <SkeletonTable rowsCount={8} />
//             </div>
//           ) : error ? (
//             <div className="table-empty">
//               <div className="empty-icon error">
//                 <i className="bi bi-exclamation-triangle"></i>
//               </div>
//               <h3>Please Refresh the page or try logout and login again</h3>
//               <p>{error.message}</p>
//               <button className="empty-clear-btn" onClick={() => refetch()}>
//                 <i className="bi bi-arrow-clockwise"></i>
//                 Try Again (Refresh the page)
//               </button>
//             </div>
//           ) : rows.length === 0 ? (
//             <div className="table-empty">
//               <div className="empty-icon">
//                 <i className="bi bi-file-earmark-x"></i>
//               </div>
//               <h3>No Records Found</h3>
//               <p>No pending lead qualification records</p>
//             </div>
//           ) : (
//             <>
//               <div className="table-wrapper">
//                 <table className="modern-table nbdin-table">
//                   <thead>
//                     <tr>
//                       <th>
//                         <div className="th-content">#</div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-person"></i> Customer Name
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-telephone"></i> Contact Number
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-building"></i> Interested In
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-person-badge"></i> Lead Gen By
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-telephone"></i> Lead Gen Number
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-person"></i> Lead Gen Name
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-chat-text"></i> Lead Remark
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-arrow-repeat"></i> Followup
//                         </div>
//                       </th>
//                       <th>
//                         <div className="th-content">
//                           <i className="bi bi-calendar"></i> Planned
//                         </div>
//                       </th>
//                       <th className="th-action">
//                         <div className="th-content">
//                           <i className="bi bi-gear"></i> Action
//                         </div>
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredRows.map((r, i) => (
//                       <tr
//                         key={r.rowIndex || i}
//                         style={{ animationDelay: `${i * 0.02}s` }}
//                       >
//                         <td>
//                           <span className="row-number">{i + 1}</span>
//                         </td>
//                         <td>
//                           <span className="customer-name">
//                             {r.customerName || "-"}
//                           </span>
//                         </td>
//                         <td>
//                           <a
//                             href={`tel:${r.contactNumber}`}
//                             className="contact-link"
//                           >
//                             <i className="bi bi-telephone-fill"></i>{" "}
//                             {r.contactNumber || "-"}
//                           </a>
//                         </td>
//                         <td>
//                           <span className="project-tag">
//                             {r.interestedIn || "-"}
//                           </span>
//                         </td>
//                         <td>{r.leadGeneratedBy || "-"}</td>
//                         <td>
//                           {r.leadGenNumber ? (
//                             <a
//                               href={`tel:${r.leadGenNumber}`}
//                               className="contact-link small"
//                             >
//                               {r.leadGenNumber}
//                             </a>
//                           ) : (
//                             "-"
//                           )}
//                         </td>
//                         <td>{r.leadGenName || "-"}</td>
//                         <td>
//                           <span className="remark-text" title={r.leadRemark}>
//                             {r.leadRemark
//                               ? r.leadRemark.length > 30
//                                 ? r.leadRemark.substring(0, 30) + "..."
//                                 : r.leadRemark
//                               : "-"}
//                           </span>
//                         </td>
//                         <td>
//                           <span className="followup-count-badge">
//                             {r.followUpCount || 0}
//                           </span>
//                         </td>
//                         <td>
//                           <span className="planned-badge green">
//                             <i className="bi bi-calendar-event"></i>{" "}
//                             {r.plannedDate || "-"}
//                           </span>
//                         </td>
//                         <td className="action-cell">
//                           <button
//                             className="action-btn"
//                             onClick={() => handleActionClick(r)}
//                             style={{
//                               background:
//                                 "linear-gradient(135deg, #10b981 0%, #059669 100%)",
//                             }}
//                             title="Update Lead"
//                           >
//                             <i className="bi bi-pencil-square"></i>
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="table-footer">
//                 <div className="footer-info">
//                   <i
//                     className="bi bi-info-circle"
//                     style={{ color: "#10b981" }}
//                   ></i>
//                   Showing <strong>{rows.length}</strong> pending record
//                   {rows.length !== 1 ? "s" : ""}
//                 </div>
//                 <div className="footer-actions">
//                   <button className="refresh-btn" onClick={() => refetch()}>
//                     <i className="bi bi-arrow-clockwise"></i> Refresh
//                   </button>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>

//         {/* ================== ACTION MODAL ================== */}
//         {showModal && selectedLead && (
//           <div className="modal-overlay" onClick={handleCloseModal}>
//             <div
//               className="modal-container modal-lg"
//               onClick={(e) => e.stopPropagation()}
//             >
//               {submitSuccess && (
//                 <div className="success-overlay">
//                   <div className="success-content">
//                     <div className="success-icon">
//                       <i className="bi bi-check-circle-fill"></i>
//                     </div>
//                     <h3>Lead Updated Successfully!</h3>
//                     <p>
//                       Followup count: {(selectedLead.followUpCount || 0) + 1}
//                     </p>
//                   </div>
//                 </div>
//               )}

//               <div
//                 className="modal-header-custom"
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #10b981 0%, #059669 100%)",
//                 }}
//               >
//                 <div className="modal-header-content">
//                   <div className="modal-icon">
//                     <i className="bi bi-file-earmark-check-fill"></i>
//                   </div>
//                   <div className="modal-header-text">
//                     <h2>Lead Qualification</h2>
//                     <div className="modal-subtitle">
//                       <span className="firm-badge">
//                         <i className="bi bi-person"></i>{" "}
//                         {selectedLead.customerName}
//                       </span>
//                       <span className="contact-badge">
//                         <i className="bi bi-telephone"></i>{" "}
//                         {selectedLead.contactNumber}
//                       </span>
//                       <span className="followup-badge">
//                         <i className="bi bi-arrow-repeat"></i> Followup:{" "}
//                         {selectedLead.followUpCount || 0}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <button className="modal-close-btn" onClick={handleCloseModal}>
//                   <i className="bi bi-x-lg"></i>
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit}>
//                 <div className="modal-body-custom">
//                   {/* Lead Info Card */}
//                   <div className="lead-info-card">
//                     <div className="info-grid">
//                       <div className="info-item">
//                         <span className="info-label">
//                           <i className="bi bi-person"></i> Customer Name
//                         </span>
//                         <span className="info-value">
//                           {selectedLead.customerName || "-"}
//                         </span>
//                       </div>
//                       <div className="info-item">
//                         <span className="info-label">
//                           <i className="bi bi-telephone"></i> Contact Number
//                         </span>
//                         <span className="info-value">
//                           <a
//                             href={`tel:${selectedLead.contactNumber}`}
//                             className="contact-link-modal"
//                           >
//                             {selectedLead.contactNumber || "-"}
//                           </a>
//                         </span>
//                       </div>
//                       <div className="info-item">
//                         <span className="info-label">
//                           <i className="bi bi-building"></i> Interested In
//                         </span>
//                         <span className="info-value">
//                           {selectedLead.interestedIn || "-"}
//                         </span>
//                       </div>
//                       <div className="info-item">
//                         <span className="info-label">
//                           <i className="bi bi-calendar"></i> Planned Date
//                         </span>
//                         <span className="info-value">
//                           <span className="planned-tag green">
//                             {selectedLead.plannedDate || "-"}
//                           </span>
//                         </span>
//                       </div>
//                       <div className="info-item full-width">
//                         <span className="info-label">
//                           <i className="bi bi-chat-text"></i> Lead Remark
//                         </span>
//                         <span className="info-value">
//                           {selectedLead.leadRemark || "-"}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Form Fields */}
//                   <div className="form-section">
//                     {/* Status */}
//                     <div className="form-group">
//                       <label className="form-label">
//                         <i className="bi bi-flag"></i> Status
//                       </label>
//                       <select
//                         name="status"
//                         value={formData.status}
//                         onChange={handleChange}
//                         className="form-select"
//                       >
//                         <option value="">-- Select Status --</option>
//                         {STATUS_OPTIONS.map((opt) => (
//                           <option key={opt} value={opt}>
//                             {opt}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     {/* Qualified */}
//                     {formData.status === "Qualified" && (
//                       <div className="conditional-section qualified-section">
//                         <div className="section-title">
//                           <i className="bi bi-star-fill"></i> Qualified Lead
//                           Details
//                         </div>

//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-building"></i> Project Selection
//                           </label>
//                           <div className="checkbox-group">
//                             {PROJECT_OPTIONS.map((project) => (
//                               <label key={project} className="checkbox-label">
//                                 <input
//                                   type="checkbox"
//                                   value={project}
//                                   checked={formData.projectSelection.includes(
//                                     project,
//                                   )}
//                                   onChange={(e) => {
//                                     const { value, checked } = e.target;
//                                     setFormData((prev) => {
//                                       if (checked) {
//                                         return {
//                                           ...prev,
//                                           projectSelection: [
//                                             ...prev.projectSelection,
//                                             value,
//                                           ],
//                                         };
//                                       }
//                                       return {
//                                         ...prev,
//                                         projectSelection:
//                                           prev.projectSelection.filter(
//                                             (p) => p !== value,
//                                           ),
//                                       };
//                                     });
//                                   }}
//                                 />
//                                 <span className="checkbox-custom"></span>
//                                 <span className="checkbox-text">{project}</span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>

//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-sticky"></i> Important Notes for
//                             this Lead
//                           </label>
//                           <textarea
//                             name="importantNote"
//                             value={formData.importantNote}
//                             onChange={handleChange}
//                             className="form-textarea"
//                             placeholder="Enter important notes..."
//                             rows="3"
//                           ></textarea>
//                         </div>

//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-bullseye"></i> Purpose
//                           </label>
//                           <select
//                             name="purpose"
//                             value={formData.purpose}
//                             onChange={handleChange}
//                             className="form-select"
//                           >
//                             <option value="">-- Select Purpose --</option>
//                             {PURPOSE_OPTIONS.map((opt) => (
//                               <option key={opt} value={opt}>
//                                 {opt}
//                               </option>
//                             ))}
//                           </select>
//                         </div>

//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-calendar-check"></i> Planned
//                             Date & Time for Site Visit
//                           </label>
//                           <input
//                             type="datetime-local"
//                             name="plannedSiteVisit"
//                             value={formData.plannedSiteVisit}
//                             onChange={handleChange}
//                             className="form-input"
//                           />
//                         </div>

//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-telephone-forward"></i> Can
//                             Contact
//                           </label>
//                           <div className="radio-group">
//                             <label className="radio-label">
//                               <input
//                                 type="radio"
//                                 name="canContact"
//                                 value="Yes"
//                                 checked={formData.canContact === "Yes"}
//                                 onChange={handleChange}
//                               />
//                               <span className="radio-custom"></span>
//                               <span className="radio-text">Yes</span>
//                             </label>
//                             <label className="radio-label">
//                               <input
//                                 type="radio"
//                                 name="canContact"
//                                 value="No"
//                                 checked={formData.canContact === "No"}
//                                 onChange={handleChange}
//                               />
//                               <span className="radio-custom"></span>
//                               <span className="radio-text">No</span>
//                             </label>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* Next Followup Required */}
//                     {formData.status === "Next Followup Required" && (
//                       <div className="conditional-section followup-section">
//                         <div className="section-title">
//                           <i className="bi bi-calendar-plus"></i> Schedule Next
//                           Follow-up
//                         </div>
//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-calendar-plus"></i> Next
//                             Follow-up Date & Time
//                           </label>
//                           <input
//                             type="datetime-local"
//                             name="nextFollowUp"
//                             value={formData.nextFollowUp}
//                             onChange={handleChange}
//                             className="form-input"
//                           />
//                         </div>
//                       </div>
//                     )}

//                     {/* Not Qualified */}
//                     {formData.status === "Not Qualified" && (
//                       <div className="conditional-section not-qualified-section">
//                         <div className="section-title warning">
//                           <i className="bi bi-x-circle"></i> Not Qualified
//                           Details
//                         </div>
//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-x-circle"></i> Reason for Not
//                             Qualified
//                           </label>
//                           <textarea
//                             name="notQualifiedReason"
//                             value={formData.notQualifiedReason}
//                             onChange={handleChange}
//                             className="form-textarea"
//                             placeholder="Enter reason why lead is not qualified..."
//                             rows="3"
//                           ></textarea>
//                         </div>
//                       </div>
//                     )}

//                     {/* Not Interested */}
//                     {formData.status === "Not Interested" && (
//                       <div className="conditional-section not-interested-section">
//                         <div className="section-title warning">
//                           <i className="bi bi-emoji-frown"></i> Not Interested
//                         </div>
//                         <p className="section-note">
//                           No additional details required. Add remarks if needed.
//                         </p>
//                       </div>
//                     )}

//                     {/* WhatsApp Section */}
//                     {showWhatsAppSection && (
//                       <div className="whatsapp-section">
//                         <div className="section-divider">
//                           <span>
//                             <i className="bi bi-whatsapp"></i> WhatsApp Details
//                           </span>
//                         </div>

//                         <div className="form-group">
//                           <label className="form-label">
//                             <i className="bi bi-whatsapp"></i> Send Details on
//                             WhatsApp?
//                           </label>
//                           <div className="radio-group">
//                             <label className="radio-label whatsapp-yes">
//                               <input
//                                 type="radio"
//                                 name="sendWhatsapp"
//                                 value="Yes"
//                                 checked={formData.sendWhatsapp === "Yes"}
//                                 onChange={handleChange}
//                               />
//                               <span className="radio-custom"></span>
//                               <span className="radio-text">
//                                 <i className="bi bi-check-lg"></i> Yes
//                               </span>
//                             </label>
//                             <label className="radio-label whatsapp-no">
//                               <input
//                                 type="radio"
//                                 name="sendWhatsapp"
//                                 value="No"
//                                 checked={formData.sendWhatsapp === "No"}
//                                 onChange={handleChange}
//                               />
//                               <span className="radio-custom"></span>
//                               <span className="radio-text">
//                                 <i className="bi bi-x-lg"></i> No
//                               </span>
//                             </label>
//                           </div>
//                         </div>

//                         {formData.sendWhatsapp === "Yes" && (
//                           <div className="whatsapp-fields">
//                             <div className="form-group">
//                               <label className="form-label">
//                                 <i className="bi bi-building"></i> Project for
//                                 WhatsApp Details
//                               </label>
//                               <select
//                                 name="whatsappProject"
//                                 value={formData.whatsappProject}
//                                 onChange={handleChange}
//                                 className="form-select"
//                               >
//                                 <option value="">-- Select Project --</option>
//                                 {PROJECT_OPTIONS.map((opt) => (
//                                   <option key={opt} value={opt}>
//                                     {opt}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>

//                             <div className="form-group">
//                               <label className="form-label">
//                                 <i className="bi bi-phone"></i> Alternate
//                                 WhatsApp Number
//                               </label>
//                               <input
//                                 type="tel"
//                                 name="alternateWhatsapp"
//                                 value={formData.alternateWhatsapp}
//                                 onChange={handleChange}
//                                 className="form-input"
//                                 placeholder={`Default: ${selectedLead.contactNumber}`}
//                                 maxLength={10}
//                               />
//                               <span className="form-help">
//                                 <i className="bi bi-info-circle"></i>
//                                 Leave empty to use: {selectedLead.contactNumber}
//                               </span>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     )}

//                     {/* Remarks */}
//                     {formData.status && (
//                       <div className="form-group remarks-group">
//                         <label className="form-label">
//                           <i className="bi bi-chat-left-text"></i> Remarks
//                         </label>
//                         <textarea
//                           name="remarks"
//                           value={formData.remarks}
//                           onChange={handleChange}
//                           className="form-textarea"
//                           placeholder="Enter any additional remarks..."
//                           rows="3"
//                         ></textarea>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="modal-footer-custom">
//                   <button
//                     type="button"
//                     className="btn-cancel"
//                     onClick={handleCloseModal}
//                     disabled={isSubmitting}
//                   >
//                     <i className="bi bi-x-circle"></i> Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="btn-submit"
//                     disabled={isSubmitting || !formData.status}
//                     style={{
//                       background:
//                         "linear-gradient(135deg, #10b981 0%, #059669 100%)",
//                     }}
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <span className="spinner-small"></span> Updating...
//                       </>
//                     ) : (
//                       <>
//                         <i className="bi bi-check-circle"></i> Save & Update
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// }

// export default CPLeadForm;







import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCPLeadFormData, updateCPLeadFormData } from "../services/cpApi";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

// ============================================
// Constants
// ============================================
const STATUS_OPTIONS = [
  "Qualified",
  "Next Followup Required",
  "No Connection Yet",
  "Not Interested",
  "Not Qualified",
];

const PROJECT_OPTIONS = [
  "Ultimate Heights",
  "My City",
  "Signature S 9",
  "Signature One",
  "Ultimate English Villas",
  "SIGNATURE HERITAGE",
  "Ultimate Sky Villa",
  "Signature Paradise",
];

const PURPOSE_OPTIONS = [
  "Investment",
  "Self Use",
  "Rental Income",
  "Business Purpose",
  "Other",
];

// ============================================
// Component
// ============================================
function CPLeadForm() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal]       = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [plannedFilter, setPlannedFilter] = useState("all");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [searchTerm, setSearchTerm]     = useState("");

  const initialFormState = {
    status: "",
    projectSelection: [],
    importantNote: "",
    purpose: "",
    plannedSiteVisit: "",
    sendWhatsapp: "",
    whatsappProject: "",
    alternateWhatsapp: "",
    nextFollowUp: "",
    remarks: "",
    notQualifiedReason: "",
    canContact: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // ============================================
  // Date Range Filter
  // ============================================
  const isDateInRange = (plannedDateStr) => {
    if (!plannedDateStr || !plannedDateStr.trim()) {
      return !dateFrom && !dateTo;
    }

    let datePart = plannedDateStr.split(" ")[0].trim();
    let planned = null;

    const hyphenSlash = datePart.match(/^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})$/);
    if (hyphenSlash) {
      let [_, p1, p2, p3] = hyphenSlash;
      let y = parseInt(p1), m = parseInt(p2), d = parseInt(p3);
      if (p1.length === 4) {
        planned = new Date(y, m - 1, d);
      } else if (p3.length === 4) {
        planned = new Date(p3, m - 1, y);
      } else {
        planned = new Date(p3, y - 1, d);
      }
    }

    if (!planned || isNaN(planned.getTime())) {
      planned = new Date(datePart);
    }

    if (isNaN(planned?.getTime())) {
      console.warn("Could not parse plannedDate:", plannedDateStr);
      return !dateFrom && !dateTo;
    }

    planned.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (plannedFilter !== "all" && !dateFrom && !dateTo) {
      if (plannedFilter === "today") {
        return planned.toDateString() === today.toDateString();
      }
      if (plannedFilter === "tomorrow") {
        const tom = new Date(today);
        tom.setDate(today.getDate() + 1);
        return planned.toDateString() === tom.toDateString();
      }
      if (plannedFilter === "overdue") {
        return planned < today;
      }
      if (plannedFilter === "this-week") {
        const end = new Date(today);
        end.setDate(today.getDate() + (6 - today.getDay()));
        return planned >= today && planned <= end;
      }
      if (plannedFilter === "next-7-days") {
        const next = new Date(today);
        next.setDate(today.getDate() + 7);
        return planned >= today && planned <= next;
      }
    }

    if (dateFrom || dateTo) {
      const fromD = dateFrom ? new Date(dateFrom) : null;
      const toD   = dateTo   ? new Date(dateTo)   : null;

      if (fromD) fromD.setHours(0, 0, 0, 0);
      if (toD)   toD.setHours(23, 59, 59, 999);

      if (fromD && toD) return planned >= fromD && planned <= toD;
      if (fromD) return planned >= fromD;
      if (toD)   return planned <= toD;
    }

    return true;
  };

  // ============================================
  // Data Fetching
  // ============================================
  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cpLeadForm"],
    queryFn: fetchCPLeadFormData,
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
  });

  const filteredRows = rows.filter((row) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const nameMatch =
      searchLower === "" ||
      (row.customerName || "").toLowerCase().includes(searchLower) ||
      (row.leadGenName  || "").toLowerCase().includes(searchLower);

    const dateMatch = isDateInRange(row.plannedDate);
    return nameMatch && dateMatch;
  });

  // ============================================
  // Update Mutation
  // ============================================
  const updateMutation = useMutation({
    mutationFn: updateCPLeadFormData,
    onSuccess: () => {
      queryClient.invalidateQueries(["cpLeadForm"]);
      setSubmitSuccess(true);
      setTimeout(() => {
        handleCloseModal();
        setSubmitSuccess(false);
      }, 1500);
    },
    onError: (err) => {
      alert(
        `Failed to update lead: ${err.response?.data?.message || err.message}`
      );
    },
  });

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    if (selectedLead) {
      setFormData(initialFormState);
    }
  }, [selectedLead]);

  // ============================================
  // Handlers
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "status") {
      // Status change hone par form reset karo
      setFormData({
        ...initialFormState,
        status: value,
      });
      return;
    }

    if (name === "sendWhatsapp" && value === "No") {
      setFormData((prev) => ({
        ...prev,
        sendWhatsapp: value,
        whatsappProject: "",
        alternateWhatsapp: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    return !!formData.status;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const updateData = {
      rowIndex:            selectedLead.rowIndex,
      status:              formData.status              || "",
      remarks:             formData.remarks             || "",
      projectSelection:    formData.projectSelection.join(", "),
      importantNote:       formData.importantNote       || "",
      purpose:             formData.purpose             || "",
      plannedSiteVisit:    formData.plannedSiteVisit    || "",
      sendWhatsapp:        formData.sendWhatsapp        || "No",
      whatsappProject:     formData.whatsappProject     || "",
      alternateWhatsapp:   formData.alternateWhatsapp   || "",
      nextFollowUp:        formData.nextFollowUp        || "",
      notQualifiedReason:  formData.notQualifiedReason  || "",
      canContact:          formData.canContact          || "Yes",
      currentFollowUpCount: selectedLead.followUpCount  || 0,
      currentPlannedDate:  selectedLead.plannedDate     || "", // ✅ No Connection Yet ke liye
    };

    try {
      await updateMutation.mutateAsync(updateData);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionClick = (lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData(initialFormState);
    setSubmitSuccess(false);
  };

  const showWhatsAppSection = [
    "Qualified",
    "Next Followup Required",
    "No Connection Yet",
  ].includes(formData.status);

  // ============================================
  // Render
  // ============================================
  return (
    <Layout
      breadcrumbs={[
        { name: "CP NBD", path: "/cp" },
        { name: "Lead Form", path: "/cp/lead-form" },
      ]}
    >
      <div className="table-page-container">
        {/* Background Elements */}
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
          ></div>
        </div>

        {/* Header Section */}
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-file-earmark-check-fill"></i>
            </div>
            <div className="header-text">
              <h1>CP Lead Qualification</h1>
              <p>Channel Partner lead qualification records</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{rows.length}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">

          {/* Filters Row */}
          {!isLoading && !error && rows.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "1.25rem",
                margin: "1.5rem 0 1.25rem 0",
                padding: "0 1rem",
              }}
            >
              {/* Search Box */}
              <div
                style={{
                  flex: "3 1 400px",
                  minWidth: "320px",
                  maxWidth: "50%",
                }}
              >
                <div className="input-group shadow-sm rounded">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 border-end-0"
                    placeholder="Search by Customer or Lead Gen Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      minWidth: "380px",
                      maxWidth: "650px",
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary border-start-0 rounded-end"
                      type="button"
                      onClick={() => setSearchTerm("")}
                      title="Clear search"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filter Dropdown */}
              <div style={{ flex: "0 0 260px", minWidth: "220px" }}>
                <select
                  className="form-select shadow-sm rounded"
                  value={plannedFilter}
                  onChange={(e) => {
                    setPlannedFilter(e.target.value);
                    if (e.target.value !== "all") {
                      setDateFrom("");
                      setDateTo("");
                    }
                  }}
                >
                  <option value="all">All Planned Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="overdue">Overdue</option>
                  <option value="this-week">This Week</option>
                  <option value="next-7-days">Next 7 Days</option>
                </select>
              </div>

              {/* Custom Date Range */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flex: "0 0 380px",
                  minWidth: "340px",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="date"
                  className="form-control shadow-sm rounded"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPlannedFilter("all");
                  }}
                  style={{ flex: "1 1 150px", minWidth: "150px" }}
                />
                <span className="text-muted fw-medium">to</span>
                <input
                  type="date"
                  className="form-control shadow-sm rounded"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPlannedFilter("all");
                  }}
                  style={{ flex: "1 1 150px", minWidth: "150px" }}
                />
              </div>
            </div>
          )}

          {/* Table Content */}
          {isLoading ? (
            <div className="table-loading">
              <SkeletonTable rowsCount={8} />
            </div>
          ) : error ? (
            <div className="table-empty">
              <div className="empty-icon error">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h3>Please Refresh the page or try logout and login again</h3>
              <p>{error.message}</p>
              <button className="empty-clear-btn" onClick={() => refetch()}>
                <i className="bi bi-arrow-clockwise"></i>
                Try Again (Refresh the page)
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-file-earmark-x"></i>
              </div>
              <h3>No Records Found</h3>
              <p>No pending lead qualification records</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="modern-table nbdin-table">
                  <thead>
                    <tr>
                      <th><div className="th-content">#</div></th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person"></i> Customer Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i> Contact Number
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-building"></i> Interested In
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person-badge"></i> Lead Gen By
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i> Lead Gen Number
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person"></i> Lead Gen Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-chat-text"></i> Lead Remark
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-arrow-repeat"></i> Followup
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar"></i> Planned
                        </div>
                      </th>
                      <th className="th-action">
                        <div className="th-content">
                          <i className="bi bi-gear"></i> Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr
                        key={r.rowIndex || i}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      >
                        <td>
                          <span className="row-number">{i + 1}</span>
                        </td>
                        <td>
                          <span className="customer-name">
                            {r.customerName || "-"}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`tel:${r.contactNumber}`}
                            className="contact-link"
                          >
                            <i className="bi bi-telephone-fill"></i>{" "}
                            {r.contactNumber || "-"}
                          </a>
                        </td>
                        <td>
                          <span className="project-tag">
                            {r.interestedIn || "-"}
                          </span>
                        </td>
                        <td>{r.leadGeneratedBy || "-"}</td>
                        <td>
                          {r.leadGenNumber ? (
                            <a
                              href={`tel:${r.leadGenNumber}`}
                              className="contact-link small"
                            >
                              {r.leadGenNumber}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{r.leadGenName || "-"}</td>
                        <td>
                          <span className="remark-text" title={r.leadRemark}>
                            {r.leadRemark
                              ? r.leadRemark.length > 30
                                ? r.leadRemark.substring(0, 30) + "..."
                                : r.leadRemark
                              : "-"}
                          </span>
                        </td>
                        <td>
                          <span className="followup-count-badge">
                            {r.followUpCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className="planned-badge green">
                            <i className="bi bi-calendar-event"></i>{" "}
                            {r.plannedDate || "-"}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() => handleActionClick(r)}
                            style={{
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            }}
                            title="Update Lead"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="footer-info">
                  <i
                    className="bi bi-info-circle"
                    style={{ color: "#10b981" }}
                  ></i>
                  Showing <strong>{rows.length}</strong> pending record
                  {rows.length !== 1 ? "s" : ""}
                </div>
                <div className="footer-actions">
                  <button className="refresh-btn" onClick={() => refetch()}>
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================== ACTION MODAL ================== */}
        {showModal && selectedLead && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-container modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {submitSuccess && (
                <div className="success-overlay">
                  <div className="success-content">
                    <div className="success-icon">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <h3>Lead Updated Successfully!</h3>
                    <p>
                      Followup count:{" "}
                      {(selectedLead.followUpCount || 0) + 1}
                    </p>
                  </div>
                </div>
              )}

              <div
                className="modal-header-custom"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-file-earmark-check-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Lead Qualification</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-person"></i>{" "}
                        {selectedLead.customerName}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-telephone"></i>{" "}
                        {selectedLead.contactNumber}
                      </span>
                      <span className="followup-badge">
                        <i className="bi bi-arrow-repeat"></i> Followup:{" "}
                        {selectedLead.followUpCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={handleCloseModal}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body-custom">

                  {/* Lead Info Card */}
                  <div className="lead-info-card">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">
                          <i className="bi bi-person"></i> Customer Name
                        </span>
                        <span className="info-value">
                          {selectedLead.customerName || "-"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">
                          <i className="bi bi-telephone"></i> Contact Number
                        </span>
                        <span className="info-value">
                          <a
                            href={`tel:${selectedLead.contactNumber}`}
                            className="contact-link-modal"
                          >
                            {selectedLead.contactNumber || "-"}
                          </a>
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">
                          <i className="bi bi-building"></i> Interested In
                        </span>
                        <span className="info-value">
                          {selectedLead.interestedIn || "-"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">
                          <i className="bi bi-calendar"></i> Planned Date
                        </span>
                        <span className="info-value">
                          <span className="planned-tag green">
                            {selectedLead.plannedDate || "-"}
                          </span>
                        </span>
                      </div>
                      <div className="info-item full-width">
                        <span className="info-label">
                          <i className="bi bi-chat-text"></i> Lead Remark
                        </span>
                        <span className="info-value">
                          {selectedLead.leadRemark || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="form-section">

                    {/* Status */}
                    <div className="form-group">
                      <label className="form-label">
                        <i className="bi bi-flag"></i> Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">-- Select Status --</option>
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ===== Qualified ===== */}
                    {formData.status === "Qualified" && (
                      <div className="conditional-section qualified-section">
                        <div className="section-title">
                          <i className="bi bi-star-fill"></i> Qualified Lead
                          Details
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-building"></i> Project Selection
                          </label>
                          <div className="checkbox-group">
                            {PROJECT_OPTIONS.map((project) => (
                              <label
                                key={project}
                                className="checkbox-label"
                              >
                                <input
                                  type="checkbox"
                                  value={project}
                                  checked={formData.projectSelection.includes(
                                    project
                                  )}
                                  onChange={(e) => {
                                    const { value, checked } = e.target;
                                    setFormData((prev) => {
                                      if (checked) {
                                        return {
                                          ...prev,
                                          projectSelection: [
                                            ...prev.projectSelection,
                                            value,
                                          ],
                                        };
                                      }
                                      return {
                                        ...prev,
                                        projectSelection:
                                          prev.projectSelection.filter(
                                            (p) => p !== value
                                          ),
                                      };
                                    });
                                  }}
                                />
                                <span className="checkbox-custom"></span>
                                <span className="checkbox-text">
                                  {project}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-sticky"></i> Important Notes
                            for this Lead
                          </label>
                          <textarea
                            name="importantNote"
                            value={formData.importantNote}
                            onChange={handleChange}
                            className="form-textarea"
                            placeholder="Enter important notes..."
                            rows="3"
                          ></textarea>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-bullseye"></i> Purpose
                          </label>
                          <select
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            className="form-select"
                          >
                            <option value="">-- Select Purpose --</option>
                            {PURPOSE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-calendar-check"></i> Planned
                            Date & Time for Site Visit
                          </label>
                          <input
                            type="datetime-local"
                            name="plannedSiteVisit"
                            value={formData.plannedSiteVisit}
                            onChange={handleChange}
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-telephone-forward"></i> Can
                            Contact
                          </label>
                          <div className="radio-group">
                            <label className="radio-label">
                              <input
                                type="radio"
                                name="canContact"
                                value="Yes"
                                checked={formData.canContact === "Yes"}
                                onChange={handleChange}
                              />
                              <span className="radio-custom"></span>
                              <span className="radio-text">Yes</span>
                            </label>
                            <label className="radio-label">
                              <input
                                type="radio"
                                name="canContact"
                                value="No"
                                checked={formData.canContact === "No"}
                                onChange={handleChange}
                              />
                              <span className="radio-custom"></span>
                              <span className="radio-text">No</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ===== Next Followup Required ===== */}
                    {formData.status === "Next Followup Required" && (
                      <div className="conditional-section followup-section">
                        <div className="section-title">
                          <i className="bi bi-calendar-plus"></i> Schedule
                          Next Follow-up
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-calendar-plus"></i> Next
                            Follow-up Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            name="nextFollowUp"
                            value={formData.nextFollowUp}
                            onChange={handleChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                    )}

                    {/* ===== Not Qualified ===== */}
                    {formData.status === "Not Qualified" && (
                      <div className="conditional-section not-qualified-section">
                        <div className="section-title warning">
                          <i className="bi bi-x-circle"></i> Not Qualified
                          Details
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-x-circle"></i> Reason for Not
                            Qualified
                          </label>
                          <textarea
                            name="notQualifiedReason"
                            value={formData.notQualifiedReason}
                            onChange={handleChange}
                            className="form-textarea"
                            placeholder="Enter reason why lead is not qualified..."
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* ===== Not Interested ===== */}
                    {formData.status === "Not Interested" && (
                      <div className="conditional-section not-interested-section">
                        <div className="section-title warning">
                          <i className="bi bi-emoji-frown"></i> Not Interested
                        </div>
                        <p className="section-note">
                          No additional details required. Add remarks if
                          needed.
                        </p>
                      </div>
                    )}

                    {/* ===== No Connection Yet ===== */}
                    {formData.status === "No Connection Yet" && (
                      <div className="conditional-section no-connection-section">
                        <div className="section-title">
                          <i className="bi bi-telephone-x"></i> No Connection
                          Yet
                        </div>
                        <p className="section-note">
                          <i className="bi bi-info-circle"></i> Planned date
                          will automatically move{" "}
                          <strong>+2 days</strong> forward from:{" "}
                          <strong>
                            {selectedLead.plannedDate || "current date"}
                          </strong>
                        </p>
                      </div>
                    )}

                    {/* ===== WhatsApp Section ===== */}
                    {showWhatsAppSection && (
                      <div className="whatsapp-section">
                        <div className="section-divider">
                          <span>
                            <i className="bi bi-whatsapp"></i> WhatsApp
                            Details
                          </span>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-whatsapp"></i> Send Details on
                            WhatsApp?
                          </label>
                          <div className="radio-group">
                            <label className="radio-label whatsapp-yes">
                              <input
                                type="radio"
                                name="sendWhatsapp"
                                value="Yes"
                                checked={formData.sendWhatsapp === "Yes"}
                                onChange={handleChange}
                              />
                              <span className="radio-custom"></span>
                              <span className="radio-text">
                                <i className="bi bi-check-lg"></i> Yes
                              </span>
                            </label>
                            <label className="radio-label whatsapp-no">
                              <input
                                type="radio"
                                name="sendWhatsapp"
                                value="No"
                                checked={formData.sendWhatsapp === "No"}
                                onChange={handleChange}
                              />
                              <span className="radio-custom"></span>
                              <span className="radio-text">
                                <i className="bi bi-x-lg"></i> No
                              </span>
                            </label>
                          </div>
                        </div>

                        {formData.sendWhatsapp === "Yes" && (
                          <div className="whatsapp-fields">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="bi bi-building"></i> Project for
                                WhatsApp Details
                              </label>
                              <select
                                name="whatsappProject"
                                value={formData.whatsappProject}
                                onChange={handleChange}
                                className="form-select"
                              >
                                <option value="">-- Select Project --</option>
                                {PROJECT_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group">
                              <label className="form-label">
                                <i className="bi bi-phone"></i> Alternate
                                WhatsApp Number
                              </label>
                              <input
                                type="tel"
                                name="alternateWhatsapp"
                                value={formData.alternateWhatsapp}
                                onChange={handleChange}
                                className="form-input"
                                placeholder={`Default: ${selectedLead.contactNumber}`}
                                maxLength={10}
                              />
                              <span className="form-help">
                                <i className="bi bi-info-circle"></i>
                                Leave empty to use:{" "}
                                {selectedLead.contactNumber}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ===== Remarks ===== */}
                    {formData.status && (
                      <div className="form-group remarks-group">
                        <label className="form-label">
                          <i className="bi bi-chat-left-text"></i> Remarks
                        </label>
                        <textarea
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleChange}
                          className="form-textarea"
                          placeholder="Enter any additional remarks..."
                          rows="3"
                        ></textarea>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer-custom">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-x-circle"></i> Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSubmitting || !formData.status}
                    style={{
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-small"></span> Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Save & Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CPLeadForm;
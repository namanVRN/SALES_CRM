// import { useState } from "react";
// import Layout from "../components/Layout";
// import "../assets/styles/CrrFollowup.css";

// function CrrFollowup() {
//   // Dummy data (Jab tak backend connect nahi hota)
//   const [data, setData] = useState([
//     {
//       taskId: "699",
//       doer: "Arham",
//       planned: "08 Sep 2026",
//       channelPartner: "Akshay Saxena",
//       freq: "W",
//       phoneNumber: "8989188880",
//       status: "Pending",
//     },
//     {
//       taskId: "700",
//       doer: "Arham",
//       planned: "15 Sep 2026",
//       channelPartner: "Akshay Saxena",
//       freq: "W",
//       phoneNumber: "8989188880",
//       status: "Pending",
//     },
//     {
//       taskId: "701",
//       doer: "Arham",
//       planned: "22 Sep 2026",
//       channelPartner: "Akshay Saxena",
//       freq: "W",
//       phoneNumber: "8989188880",
//       status: "Pending",
//     },
//     {
//       taskId: "702",
//       doer: "Arham",
//       planned: "29 Sep 2026",
//       channelPartner: "Akshay Saxena",
//       freq: "W",
//       phoneNumber: "8989188880",
//       status: "Pending",
//     },
//   ]);

//   // Filter States
//   const [selectedCp, setSelectedCp] = useState("All");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Modal States
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [remark, setRemark] = useState("");
//   const [leadDetails, setLeadDetails] = useState("");

//   // Filtered List Logic
//   const filteredData = data.filter((item) => {
//     if (selectedCp !== "All" && item.channelPartner !== selectedCp) return false;
//     return true;
//   });

//   // Modal Submit Handlers
//   const handleMarkAsDone = () => {
//     if (!selectedTask) return;
//     // Mark as done logic
//     setData((prev) => prev.filter((item) => item.taskId !== selectedTask.taskId));
//     setSelectedTask(null);
//     setRemark("");
//     setLeadDetails("");
//   };

//   return (
//     <Layout
//       breadcrumbs={[
//         { name: "Channel Partner", path: "/channel-partner" },
//         { name: "CRR Followup", path: "/channel-partner/crr-followup" },
//       ]}
//     >
//       <div className="crr-container">
//         {/* Top Header Banner */}
//         <div className="crr-header-banner">
//           <div>
//             <h1>Channel Partner Follow-up</h1>
//             <p>Dashboard</p>
//           </div>
//           <div className="crr-badge">{filteredData.length} Pending</div>
//         </div>

//         {/* Filters Bar */}
//         <div className="crr-filters-card">
//           <div className="crr-filter-group">
//             <label>CHANNEL PARTNER</label>
//             <select
//               value={selectedCp}
//               onChange={(e) => setSelectedCp(e.target.value)}
//             >
//               <option value="All">All Partners</option>
//               <option value="Akshay Saxena">Akshay Saxena</option>
//             </select>
//           </div>

//           <div className="crr-filter-group">
//             <label>FROM</label>
//             <input
//               type="date"
//               value={fromDate}
//               onChange={(e) => setFromDate(e.target.value)}
//             />
//           </div>

//           <div className="crr-filter-group">
//             <label>TO</label>
//             <input
//               type="date"
//               value={toDate}
//               onChange={(e) => setToDate(e.target.value)}
//             />
//           </div>

//           <div className="crr-filter-actions">
//             <button
//               className="btn-purple"
//               onClick={() => {
//                 const today = new Date().toISOString().split("T")[0];
//                 setFromDate(today);
//                 setToDate(today);
//               }}
//             >
//               📅 Today
//             </button>
//             <button
//               className="btn-outline"
//               onClick={() => {
//                 setSelectedCp("All");
//                 setFromDate("");
//                 setToDate("");
//               }}
//             >
//               🔄 Reset
//             </button>
//             <button className="btn-purple">🔄 Refresh</button>
//           </div>
//         </div>

//         {/* Data Table */}
//         <div className="crr-table-wrapper">
//           <table className="crr-table">
//             <thead>
//               <tr>
//                 <th>TASK ID</th>
//                 <th>DOER</th>
//                 <th>PLANNED</th>
//                 <th>CHANNEL PARTNER</th>
//                 <th>FREQ</th>
//                 <th>PHONE NUMBER</th>
//                 <th>STATUS</th>
//                 <th>ACTION</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredData.map((row) => (
//                 <tr key={row.taskId}>
//                   <td><strong>{row.taskId}</strong></td>
//                   <td>{row.doer}</td>
//                   <td>{row.planned}</td>
//                   <td><strong>{row.channelPartner}</strong></td>
//                   <td><span className="badge-freq">{row.freq}</span></td>
//                   <td>{row.phoneNumber}</td>
//                   <td><span className="badge-pending">Pending</span></td>
//                   <td>
//                     <button
//                       className="btn-done"
//                       onClick={() => {
//                         setSelectedTask(row);
//                         setRemark("");
//                         setLeadDetails("");
//                       }}
//                     >
//                       ✓ Done
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Checklist Form Modal (Jab 'Done' par click hoga) */}
//         {selectedTask && (
//           <div className="crr-modal-backdrop">
//             <div className="crr-modal">
//               {/* Modal Header */}
//               <div className="crr-modal-header">
//                 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <div className="crr-modal-icon">☑</div>
//                   <h3 style={{ margin: 0 }}>Checklist Form</h3>
//                 </div>
//                 <button
//                   className="crr-close-btn"
//                   onClick={() => setSelectedTask(null)}
//                 >
//                   ✕
//                 </button>
//               </div>

//               {/* Task Details Grid */}
//               <div className="crr-modal-details">
//                 <div>
//                   <small>TASK ID</small>
//                   <p>{selectedTask.taskId}</p>
//                 </div>
//                 <div>
//                   <small>CHANNEL PARTNER</small>
//                   <p>{selectedTask.channelPartner}</p>
//                 </div>
//                 <div>
//                   <small>DOER</small>
//                   <p>{selectedTask.doer}</p>
//                 </div>
//                 <div>
//                   <small>PLANNED</small>
//                   <p>{selectedTask.planned}</p>
//                 </div>
//                 <div style={{ gridColumn: "span 2" }}>
//                   <small>PHONE NUMBER</small>
//                   <p>{selectedTask.phoneNumber}</p>
//                 </div>
//               </div>

//               {/* Form Inputs */}
//               <div className="crr-modal-body">
//                 <div className="form-group">
//                   <label>Remark</label>
//                   <textarea
//                     rows={3}
//                     placeholder="Enter your remark..."
//                     value={remark}
//                     onChange={(e) => setRemark(e.target.value)}
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>Any Lead Details</label>
//                   <textarea
//                     rows={3}
//                     placeholder="Enter lead details if any..."
//                     value={leadDetails}
//                     onChange={(e) => setLeadDetails(e.target.value)}
//                   />
//                 </div>
//               </div>

//               {/* Modal Actions */}
//               <div className="crr-modal-footer">
//                 <button
//                   className="btn-cancel"
//                   onClick={() => setSelectedTask(null)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="btn-mark-done"
//                   onClick={handleMarkAsDone}
//                 >
//                   Mark as Done
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// }

// export default CrrFollowup;







import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { fetchCrrFollowupList, markCrrFollowupDone } from "../services/api";
import "../assets/styles/CrrFollowup.css";

function CrrFollowup() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCp, setSelectedCp] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal States
  const [selectedTask, setSelectedTask] = useState(null);
  const [remark, setRemark] = useState("");
  const [leadDetails, setLeadDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // Fetch Data from API
  // ==========================================
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchCrrFollowupList();
      if (res.success) {
        setData(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching CRR Followup list:", error);
      alert("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Run once on mount
  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // Filter Logic
  // ==========================================
  const filteredData = data.filter((item) => {
    // 1. Channel Partner Filter
    if (selectedCp !== "All" && item.channelPartner !== selectedCp) {
      return false;
    }

    // 2. Date Filter
    if (fromDate || toDate) {
      const itemDate = new Date(item.planned);
      if (!isNaN(itemDate)) {
        if (fromDate && itemDate < new Date(fromDate)) return false;
        if (toDate && itemDate > new Date(toDate)) return false;
      }
    }

    return true;
  });

  // Extract unique CPs for the dropdown
  const cpOptions = [
    "All",
    ...new Set(data.map((item) => item.channelPartner).filter(Boolean)),
  ];

  // ==========================================
  // Action Handlers
  // ==========================================
  const handleTodayFilter = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
  };

  const handleResetFilter = () => {
    setSelectedCp("All");
    setFromDate("");
    setToDate("");
  };

  const openModal = (task) => {
    setSelectedTask(task);
    setRemark("");
    setLeadDetails("");
  };

  const closeModal = () => {
    setSelectedTask(null);
    setRemark("");
    setLeadDetails("");
  };

  const handleSubmitDone = async () => {
    if (!selectedTask) return;
    
    setSubmitting(true);
    try {
      const payload = {
        taskId: selectedTask.taskId,
        channelPartner: selectedTask.channelPartner,
        remark: remark,
        leadDetails: leadDetails,
      };

      const res = await markCrrFollowupDone(payload);

      if (res.success) {
        // Successfully submitted, reload table data and close modal
        await loadData();
        closeModal();
      } else {
        alert("Failed to mark as done: " + res.message);
      }
    } catch (error) {
      console.error("Error marking task as done:", error);
      alert("An error occurred while saving the data.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      breadcrumbs={[
        { name: "Channel Partner", path: "/channel-partner" },
        { name: "CRR Followup", path: "/channel-partner/crr-followup" },
      ]}
    >
      <div className="crr-container">
        {/* Top Header Banner */}
        <div className="crr-header-banner">
          <div>
            <h1>Channel Partner Follow-up</h1>
            <p>Dashboard</p>
          </div>
          <div className="crr-badge">{filteredData.length} Pending</div>
        </div>

        {/* Filters Bar */}
        <div className="crr-filters-card">
          <div className="crr-filter-group">
            <label>CHANNEL PARTNER</label>
            <select
              value={selectedCp}
              onChange={(e) => setSelectedCp(e.target.value)}
            >
              {cpOptions.map((cp, idx) => (
                <option key={idx} value={cp}>
                  {cp === "All" ? "All Partners" : cp}
                </option>
              ))}
            </select>
          </div>

          <div className="crr-filter-group">
            <label>FROM</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="crr-filter-group">
            <label>TO</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="crr-filter-actions">
            <button className="btn-purple" onClick={handleTodayFilter}>
              <i className="bi bi-calendar-event"></i> Today
            </button>
            <button className="btn-outline" onClick={handleResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i> Reset
            </button>
            <button className="btn-purple" onClick={loadData}>
              <i className="bi bi-arrow-repeat"></i> Refresh
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="crr-table-wrapper">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              <i className="bi bi-arrow-repeat" style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: "8px" }}></i>
              Loading Tasks...
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              No pending tasks found.
            </div>
          ) : (
            <table className="crr-table">
              <thead>
                <tr>
                  <th>TASK ID</th>
                  <th>DOER</th>
                  <th>PLANNED</th>
                  <th>CHANNEL PARTNER</th>
                  <th>FREQ</th>
                  <th>PHONE NUMBER</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.taskId || Math.random()}>
                    <td><strong>{row.taskId}</strong></td>
                    <td>{row.doer}</td>
                    <td>{row.planned}</td>
                    <td><strong>{row.channelPartner}</strong></td>
                    <td><span className="badge-freq">{row.freq || "W"}</span></td>
                    <td>{row.phoneNumber}</td>
                    <td><span className="badge-pending">{row.status}</span></td>
                    <td>
                      <button
                        className="btn-done"
                        onClick={() => openModal(row)}
                      >
                        <i className="bi bi-check2"></i> Done
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Checklist Form Modal (Jab 'Done' par click hoga) */}
        {selectedTask && (
          <div className="crr-modal-backdrop">
            <div className="crr-modal">
              {/* Modal Header */}
              <div className="crr-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="crr-modal-icon">
                    <i className="bi bi-check2-square"></i>
                  </div>
                  <h3 style={{ margin: 0 }}>Checklist Form</h3>
                </div>
                <button
                  className="crr-close-btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>

              {/* Task Details Grid */}
              <div className="crr-modal-details">
                <div>
                  <small>TASK ID</small>
                  <p>{selectedTask.taskId}</p>
                </div>
                <div>
                  <small>CHANNEL PARTNER</small>
                  <p>{selectedTask.channelPartner}</p>
                </div>
                <div>
                  <small>DOER</small>
                  <p>{selectedTask.doer}</p>
                </div>
                <div>
                  <small>PLANNED</small>
                  <p>{selectedTask.planned}</p>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <small>PHONE NUMBER</small>
                  <p>{selectedTask.phoneNumber}</p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="crr-modal-body">
                <div className="form-group">
                  <label>Remark</label>
                  <textarea
                    rows={3}
                    placeholder="Enter your remark..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Any Lead Details</label>
                  <textarea
                    rows={3}
                    placeholder="Enter lead details if any..."
                    value={leadDetails}
                    onChange={(e) => setLeadDetails(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="crr-modal-footer">
                <button
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn-mark-done"
                  onClick={handleSubmitDone}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Mark as Done"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CrrFollowup;
// import { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext";
// import { toast } from "react-toastify";

// function BirthdayPopup() {
//   const { user } = useAuth();
//   const [birthdays, setBirthdays] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showPopup, setShowPopup] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     const isAllowed = 
//       user?.email === "bdm3@company.com" || 
//       user?.role === "admin";

//     if (isAllowed) {
//       fetchTodayBirthdays();
//     }
//   }, [user]);

//   const fetchTodayBirthdays = async () => {
//     try {
//       setLoading(true);
//       const API_BASE = import.meta.env.VITE_API_BASE;
      
//       const bdmName = user?.role === "admin" ? "" : (user?.name || "");
//       const url = `${API_BASE}/cp/birthdays/today${bdmName ? `?bdmName=${encodeURIComponent(bdmName)}` : ''}`;
      
//       const response = await fetch(url);
//       const data = await response.json();

//       if (data.success && data.birthdays && data.birthdays.length > 0) {
//         setBirthdays(data.birthdays);
//         setShowPopup(true);
//       }
//     } catch (error) {
//       console.error("Failed to fetch birthdays:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const sendWhatsAppWish = (cp) => {
//     const message = encodeURIComponent(
//       `Dear ${cp.name},\n\n` +
//       `Wishing you a very Happy Birthday! 🎂\n\n` +
//       `On behalf of VRN Inc., we extend our heartfelt wishes for a wonderful year ahead filled with success, prosperity, and joy.\n\n` +
//       `Thank you for being a valued Channel Partner. We appreciate your continued trust and partnership.\n\n` +
//       `Best Regards,\n${user?.name || "Team"}\nVRN INC.`
//     );

//     const phone = cp.phone.toString().replace(/\D/g, "");
//     const phoneWithCode = phone.startsWith("91") ? phone : `91${phone}`;
    
//     window.open(`https://wa.me/${phoneWithCode}?text=${message}`, "_blank");
//     toast.success(`WhatsApp opened for ${cp.name}`);
//   };

//   const callCP = (phone) => {
//     const cleanPhone = phone.toString().replace(/\D/g, "");
//     window.location.href = `tel:${cleanPhone}`;
//   };

//   const handleClose = () => {
//     setShowPopup(false);
//   };

//   const nextBirthday = () => {
//     if (currentIndex < birthdays.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     }
//   };

//   const prevBirthday = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//     }
//   };

//   if (!showPopup || birthdays.length === 0) return null;

//   const currentCP = birthdays[currentIndex];

//   return (
//     <>
//       <div style={styles.overlay} onClick={handleClose}>
//         <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
          
//           {/* Close Button */}
//           <button style={styles.closeBtn} onClick={handleClose}>
//             <i className="bi bi-x-lg"></i>
//           </button>

//           {/* Top Accent Bar */}
//           <div style={styles.accentBar}></div>

//           {/* Header */}
//           <div style={styles.header}>
//             <div style={styles.iconWrapper}>
//               <i className="bi bi-gift-fill" style={styles.headerIcon}></i>
//             </div>
//             <div style={styles.headerText}>
//               <p style={styles.eyebrow}>BIRTHDAY REMINDER</p>
//               <h1 style={styles.title}>Channel Partner Birthday</h1>
//               <p style={styles.subtitle}>
//                 {birthdays.length > 1 
//                   ? `${currentIndex + 1} of ${birthdays.length} birthdays today`
//                   : `Today's celebration`}
//               </p>
//             </div>
//           </div>

//           {/* Divider */}
//           <div style={styles.divider}></div>

//           {/* CP Card */}
//           <div style={styles.cpSection}>
//             <div style={styles.avatarSection}>
//               <div style={styles.avatar}>
//                 {currentCP.name.charAt(0).toUpperCase()}
//               </div>
//               <div style={styles.nameSection}>
//                 <h2 style={styles.cpName}>{currentCP.name}</h2>
//                 <p style={styles.dobText}>
//                   <i className="bi bi-calendar3" style={{marginRight: 6}}></i>
//                   {currentCP.dob}
//                 </p>
//               </div>
//             </div>

//             {/* Info Grid */}
//             <div style={styles.infoGrid}>
//               <div style={styles.infoItem}>
//                 <div style={styles.infoIconWrapper}>
//                   <i className="bi bi-telephone-fill" style={styles.infoIcon}></i>
//                 </div>
//                 <div>
//                   <p style={styles.infoLabel}>Contact</p>
//                   <p style={styles.infoValue}>{currentCP.phone || "N/A"}</p>
//                 </div>
//               </div>

//               <div style={styles.infoItem}>
//                 <div style={styles.infoIconWrapper}>
//                   <i className="bi bi-person-badge-fill" style={styles.infoIcon}></i>
//                 </div>
//                 <div>
//                   <p style={styles.infoLabel}>Unique ID</p>
//                   <p style={styles.infoValue}>{currentCP.uniqueId || "N/A"}</p>
//                 </div>
//               </div>

//               <div style={styles.infoItem}>
//                 <div style={styles.infoIconWrapper}>
//                   <i className="bi bi-briefcase-fill" style={styles.infoIcon}></i>
//                 </div>
//                 <div>
//                   <p style={styles.infoLabel}>Deal Type</p>
//                   <p style={styles.infoValue}>{currentCP.dealType || "N/A"}</p>
//                 </div>
//               </div>

//               <div style={styles.infoItem}>
//                 <div style={styles.infoIconWrapper}>
//                   <i className="bi bi-people-fill" style={styles.infoIcon}></i>
//                 </div>
//                 <div>
//                   <p style={styles.infoLabel}>Team Member</p>
//                   <p style={styles.infoValue}>{currentCP.teamMember || "Unassigned"}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Message Note */}
//             {/* <div style={styles.noteBox}>
//               <i className="bi bi-info-circle" style={styles.noteIcon}></i>
//               <p style={styles.noteText}>
//                 Send a professional birthday message to strengthen your business relationship.
//               </p>
//             </div> */}
//           </div>

//           {/* Action Buttons */}
//           <div style={styles.actions}>
//             <button
//               onClick={() => callCP(currentCP.phone)}
//               style={styles.callBtn}
//             >
//               <i className="bi bi-telephone-fill" style={{marginRight: 8}}></i>
//               Call
//             </button>
//             <button
//               onClick={() => sendWhatsAppWish(currentCP)}
//               style={styles.whatsappBtn}
//             >
//               <i className="bi bi-whatsapp" style={{marginRight: 8}}></i>
//               Send WhatsApp Wish
//             </button>
//           </div>

//           {/* Navigation */}
//           {birthdays.length > 1 && (
//             <div style={styles.navigation}>
//               <button 
//                 style={{
//                   ...styles.navBtn,
//                   opacity: currentIndex === 0 ? 0.3 : 1,
//                   cursor: currentIndex === 0 ? "not-allowed" : "pointer"
//                 }}
//                 onClick={prevBirthday}
//                 disabled={currentIndex === 0}
//               >
//                 <i className="bi bi-chevron-left"></i>
//               </button>
              
//               <div style={styles.pagination}>
//                 <span style={styles.pageInfo}>
//                   {currentIndex + 1} / {birthdays.length}
//                 </span>
//               </div>

//               <button 
//                 style={{
//                   ...styles.navBtn,
//                   opacity: currentIndex === birthdays.length - 1 ? 0.3 : 1,
//                   cursor: currentIndex === birthdays.length - 1 ? "not-allowed" : "pointer"
//                 }}
//                 onClick={nextBirthday}
//                 disabled={currentIndex === birthdays.length - 1}
//               >
//                 <i className="bi bi-chevron-right"></i>
//               </button>
//             </div>
//           )}

//           {/* Footer */}
//           <div style={styles.footer}>
//             <button style={styles.dismissBtn} onClick={handleClose}>
//               Remind me later
//             </button>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes slideUp {
//           from { 
//             transform: translateY(30px); 
//             opacity: 0; 
//           }
//           to { 
//             transform: translateY(0); 
//             opacity: 1; 
//           }
//         }

//         @keyframes fadeIn {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//       `}</style>
//     </>
//   );
// }

// const styles = {
//   overlay: {
//     position: "fixed",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: "rgba(15, 23, 42, 0.75)",
//     backdropFilter: "blur(6px)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 9999,
//     animation: "fadeIn 0.2s ease-out",
//     padding: "20px",
//   },
//   popup: {
//     background: "#ffffff",
//     borderRadius: "16px",
//     padding: "0",
//     maxWidth: "520px",
//     width: "100%",
//     maxHeight: "90vh",
//     overflow: "hidden",
//     boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
//     position: "relative",
//     animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
//     border: "1px solid rgba(0, 0, 0, 0.05)",
//   },
//   closeBtn: {
//     position: "absolute",
//     top: "16px",
//     right: "16px",
//     background: "rgba(0, 0, 0, 0.05)",
//     border: "none",
//     color: "#64748b",
//     width: "32px",
//     height: "32px",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontSize: "14px",
//     zIndex: 2,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     transition: "all 0.2s",
//   },
//   accentBar: {
//     height: "4px",
//     background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)",
//   },
//   header: {
//     padding: "28px 28px 20px 28px",
//     display: "flex",
//     gap: "16px",
//     alignItems: "flex-start",
//   },
//   iconWrapper: {
//     width: "56px",
//     height: "56px",
//     borderRadius: "12px",
//     background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//     boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
//   },
//   headerIcon: {
//     fontSize: "24px",
//     color: "white",
//   },
//   headerText: {
//     flex: 1,
//   },
//   eyebrow: {
//     margin: 0,
//     fontSize: "11px",
//     fontWeight: "700",
//     color: "#3b82f6",
//     letterSpacing: "1.5px",
//     textTransform: "uppercase",
//   },
//   title: {
//     margin: "6px 0 4px 0",
//     fontSize: "22px",
//     fontWeight: "700",
//     color: "#0f172a",
//     letterSpacing: "-0.3px",
//   },
//   subtitle: {
//     margin: 0,
//     fontSize: "13px",
//     color: "#64748b",
//   },
//   divider: {
//     height: "1px",
//     background: "#e2e8f0",
//     margin: "0 28px",
//   },
//   cpSection: {
//     padding: "24px 28px",
//   },
//   avatarSection: {
//     display: "flex",
//     alignItems: "center",
//     gap: "16px",
//     marginBottom: "24px",
//   },
//   avatar: {
//     width: "64px",
//     height: "64px",
//     borderRadius: "12px",
//     background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
//     color: "white",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "28px",
//     fontWeight: "700",
//     boxShadow: "0 4px 12px rgba(30, 41, 59, 0.2)",
//   },
//   nameSection: {
//     flex: 1,
//   },
//   cpName: {
//     margin: 0,
//     fontSize: "20px",
//     fontWeight: "700",
//     color: "#0f172a",
//   },
//   dobText: {
//     margin: "4px 0 0 0",
//     fontSize: "13px",
//     color: "#64748b",
//     display: "flex",
//     alignItems: "center",
//   },
//   infoGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "12px",
//     marginBottom: "20px",
//   },
//   infoItem: {
//     background: "#f8fafc",
//     padding: "14px",
//     borderRadius: "10px",
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     border: "1px solid #e2e8f0",
//   },
//   infoIconWrapper: {
//     width: "36px",
//     height: "36px",
//     borderRadius: "8px",
//     background: "white",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     border: "1px solid #e2e8f0",
//     flexShrink: 0,
//   },
//   infoIcon: {
//     fontSize: "14px",
//     color: "#3b82f6",
//   },
//   infoLabel: {
//     margin: 0,
//     fontSize: "11px",
//     color: "#64748b",
//     fontWeight: "500",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//   },
//   infoValue: {
//     margin: "2px 0 0 0",
//     fontSize: "14px",
//     color: "#0f172a",
//     fontWeight: "600",
//   },
//   noteBox: {
//     background: "#eff6ff",
//     padding: "12px 14px",
//     borderRadius: "8px",
//     display: "flex",
//     alignItems: "flex-start",
//     gap: "10px",
//     border: "1px solid #dbeafe",
//   },
//   noteIcon: {
//     fontSize: "16px",
//     color: "#3b82f6",
//     marginTop: "1px",
//   },
//   noteText: {
//     margin: 0,
//     fontSize: "13px",
//     color: "#1e40af",
//     lineHeight: "1.5",
//   },
//   actions: {
//     display: "flex",
//     gap: "10px",
//     padding: "0 28px 20px 28px",
//   },
//   callBtn: {
//     flex: 1,
//     background: "white",
//     color: "#0f172a",
//     padding: "12px 20px",
//     border: "1.5px solid #e2e8f0",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "14px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     transition: "all 0.2s",
//   },
//   whatsappBtn: {
//     flex: 2,
//     background: "#22c55e",
//     color: "white",
//     padding: "12px 24px",
//     border: "none",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "14px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     transition: "all 0.2s",
//     boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)",
//   },
//   navigation: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "0 28px 16px 28px",
//     borderTop: "1px solid #e2e8f0",
//     paddingTop: "16px",
//   },
//   navBtn: {
//     background: "white",
//     color: "#475569",
//     padding: "8px 12px",
//     border: "1px solid #e2e8f0",
//     borderRadius: "8px",
//     fontSize: "14px",
//     transition: "all 0.2s",
//   },
//   pagination: {
//     flex: 1,
//     textAlign: "center",
//   },
//   pageInfo: {
//     fontSize: "13px",
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   footer: {
//     textAlign: "center",
//     padding: "12px 28px 20px 28px",
//     background: "#f8fafc",
//     borderTop: "1px solid #e2e8f0",
//   },
//   dismissBtn: {
//     background: "transparent",
//     color: "#64748b",
//     border: "none",
//     fontSize: "13px",
//     cursor: "pointer",
//     fontWeight: "500",
//   },
// };

// export default BirthdayPopup;





import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function BirthdayPopup() {
  const { user } = useAuth();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const isAllowed = 
      user?.email === "bdm3@company.com" || 
      user?.role === "admin";

    if (isAllowed) {
      fetchTodayBirthdays();
    }
  }, [user]);

  const fetchTodayBirthdays = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE;
      
      // ✅ Email based identification
      const params = new URLSearchParams();
      if (user?.role === "admin") {
        params.append("isAdmin", "true");
      } else {
        params.append("bdmEmail", user?.email || "");
      }
      
      const url = `${API_BASE}/cp/birthdays/today?${params.toString()}`;
      console.log("🔍 [BIRTHDAY] Fetching:", url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log("🔍 [BIRTHDAY] Response:", data);

      if (data.success && data.birthdays && data.birthdays.length > 0) {
        setBirthdays(data.birthdays);
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Failed to fetch birthdays:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppWish = (cp) => {
    const message = encodeURIComponent(
      `Dear ${cp.name},\n\n` +
      `Wishing you a very Happy Birthday! 🎂\n\n` +
      `On behalf of VRN Inc., we extend our heartfelt wishes for a wonderful year ahead filled with success, prosperity, and joy.\n\n` +
      `Thank you for being a valued Channel Partner. We appreciate your continued trust and partnership.\n\n` +
      `Best Regards,\n${user?.name || "Team"}\nVRN INC.`
    );

    const phone = cp.phone.toString().replace(/\D/g, "");
    const phoneWithCode = phone.startsWith("91") ? phone : `91${phone}`;
    
    window.open(`https://wa.me/${phoneWithCode}?text=${message}`, "_blank");
    toast.success(`WhatsApp opened for ${cp.name}`);
  };

  const callCP = (phone) => {
    const cleanPhone = phone.toString().replace(/\D/g, "");
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleClose = () => setShowPopup(false);
  const nextBirthday = () => currentIndex < birthdays.length - 1 && setCurrentIndex(currentIndex + 1);
  const prevBirthday = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  if (!showPopup || birthdays.length === 0) return null;

  const currentCP = birthdays[currentIndex];

  return (
    <>
      <div style={styles.overlay} onClick={handleClose}>
        <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeBtn} onClick={handleClose}>
            <i className="bi bi-x-lg"></i>
          </button>

          <div style={styles.accentBar}></div>

          <div style={styles.header}>
            <div style={styles.iconWrapper}>
              <i className="bi bi-gift-fill" style={styles.headerIcon}></i>
            </div>
            <div style={styles.headerText}>
              <p style={styles.eyebrow}>BIRTHDAY REMINDER</p>
              <h1 style={styles.title}>Channel Partner Birthday</h1>
              <p style={styles.subtitle}>
                {birthdays.length > 1 
                  ? `${currentIndex + 1} of ${birthdays.length} birthdays today`
                  : `Today's celebration`}
              </p>
            </div>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.cpSection}>
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                {currentCP.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.nameSection}>
                <h2 style={styles.cpName}>{currentCP.name}</h2>
                <p style={styles.dobText}>
                  <i className="bi bi-calendar3" style={{marginRight: 6}}></i>
                  {currentCP.dob}
                </p>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoIconWrapper}>
                  <i className="bi bi-telephone-fill" style={styles.infoIcon}></i>
                </div>
                <div>
                  <p style={styles.infoLabel}>Contact</p>
                  <p style={styles.infoValue}>{currentCP.phone || "N/A"}</p>
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoIconWrapper}>
                  <i className="bi bi-person-badge-fill" style={styles.infoIcon}></i>
                </div>
                <div>
                  <p style={styles.infoLabel}>Unique ID</p>
                  <p style={styles.infoValue}>{currentCP.uniqueId || "N/A"}</p>
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoIconWrapper}>
                  <i className="bi bi-briefcase-fill" style={styles.infoIcon}></i>
                </div>
                <div>
                  <p style={styles.infoLabel}>Deal Type</p>
                  <p style={styles.infoValue}>{currentCP.dealType || "N/A"}</p>
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoIconWrapper}>
                  <i className="bi bi-people-fill" style={styles.infoIcon}></i>
                </div>
                <div>
                  <p style={styles.infoLabel}>Team Member</p>
                  <p style={styles.infoValue}>{currentCP.teamMember || "Unassigned"}</p>
                </div>
              </div>
            </div>

            {/* <div style={styles.noteBox}>
              <i className="bi bi-info-circle" style={styles.noteIcon}></i>
              <p style={styles.noteText}>
                Send a professional birthday message to strengthen your business relationship.
              </p>
            </div> */}
          </div>

          <div style={styles.actions}>
            <button onClick={() => callCP(currentCP.phone)} style={styles.callBtn}>
              <i className="bi bi-telephone-fill" style={{marginRight: 8}}></i>
              Call
            </button>
            <button onClick={() => sendWhatsAppWish(currentCP)} style={styles.whatsappBtn}>
              <i className="bi bi-whatsapp" style={{marginRight: 8}}></i>
              Send WhatsApp Wish
            </button>
          </div>

          {birthdays.length > 1 && (
            <div style={styles.navigation}>
              <button 
                style={{...styles.navBtn, opacity: currentIndex === 0 ? 0.3 : 1}}
                onClick={prevBirthday}
                disabled={currentIndex === 0}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <div style={styles.pagination}>
                <span style={styles.pageInfo}>{currentIndex + 1} / {birthdays.length}</span>
              </div>
              <button 
                style={{...styles.navBtn, opacity: currentIndex === birthdays.length - 1 ? 0.3 : 1}}
                onClick={nextBirthday}
                disabled={currentIndex === birthdays.length - 1}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}

          <div style={styles.footer}>
            <button style={styles.dismissBtn} onClick={handleClose}>Remind me later</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 9999, animation: "fadeIn 0.2s ease-out", padding: "20px",
  },
  popup: {
    background: "#ffffff", borderRadius: "16px", padding: "0",
    maxWidth: "520px", width: "100%", maxHeight: "90vh", overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)", position: "relative",
    animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },
  closeBtn: {
    position: "absolute", top: "16px", right: "16px",
    background: "rgba(0, 0, 0, 0.05)", border: "none", color: "#64748b",
    width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer",
    fontSize: "14px", zIndex: 2, display: "flex",
    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
  },
  accentBar: {
    height: "4px",
    background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)",
  },
  header: { padding: "28px 28px 20px 28px", display: "flex", gap: "16px", alignItems: "flex-start" },
  iconWrapper: {
    width: "56px", height: "56px", borderRadius: "12px",
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  headerIcon: { fontSize: "24px", color: "white" },
  headerText: { flex: 1 },
  eyebrow: {
    margin: 0, fontSize: "11px", fontWeight: "700", color: "#3b82f6",
    letterSpacing: "1.5px", textTransform: "uppercase",
  },
  title: { margin: "6px 0 4px 0", fontSize: "22px", fontWeight: "700", color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "13px", color: "#64748b" },
  divider: { height: "1px", background: "#e2e8f0", margin: "0 28px" },
  cpSection: { padding: "24px 28px" },
  avatarSection: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  avatar: {
    width: "64px", height: "64px", borderRadius: "12px",
    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "28px", fontWeight: "700",
  },
  nameSection: { flex: 1 },
  cpName: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" },
  dobText: { margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" },
  infoItem: {
    background: "#f8fafc", padding: "14px", borderRadius: "10px",
    display: "flex", alignItems: "center", gap: "12px", border: "1px solid #e2e8f0",
  },
  infoIconWrapper: {
    width: "36px", height: "36px", borderRadius: "8px", background: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #e2e8f0", flexShrink: 0,
  },
  infoIcon: { fontSize: "14px", color: "#3b82f6" },
  infoLabel: { margin: 0, fontSize: "11px", color: "#64748b", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" },
  infoValue: { margin: "2px 0 0 0", fontSize: "14px", color: "#0f172a", fontWeight: "600" },
  noteBox: {
    background: "#eff6ff", padding: "12px 14px", borderRadius: "8px",
    display: "flex", alignItems: "flex-start", gap: "10px", border: "1px solid #dbeafe",
  },
  noteIcon: { fontSize: "16px", color: "#3b82f6", marginTop: "1px" },
  noteText: { margin: 0, fontSize: "13px", color: "#1e40af", lineHeight: "1.5" },
  actions: { display: "flex", gap: "10px", padding: "0 28px 20px 28px" },
  callBtn: {
    flex: 1, background: "white", color: "#0f172a", padding: "12px 20px",
    border: "1.5px solid #e2e8f0", borderRadius: "10px", cursor: "pointer",
    fontWeight: "600", fontSize: "14px", display: "flex",
    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
  },
  whatsappBtn: {
    flex: 2, background: "#22c55e", color: "white", padding: "12px 24px",
    border: "none", borderRadius: "10px", cursor: "pointer",
    fontWeight: "600", fontSize: "14px", display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)",
  },
  navigation: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 28px 16px 28px", borderTop: "1px solid #e2e8f0", paddingTop: "16px",
  },
  navBtn: {
    background: "white", color: "#475569", padding: "8px 12px",
    border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
  },
  pagination: { flex: 1, textAlign: "center" },
  pageInfo: { fontSize: "13px", color: "#64748b", fontWeight: "600" },
  footer: { textAlign: "center", padding: "12px 28px 20px 28px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" },
  dismissBtn: { background: "transparent", color: "#64748b", border: "none", fontSize: "13px", cursor: "pointer", fontWeight: "500" },
};

export default BirthdayPopup;
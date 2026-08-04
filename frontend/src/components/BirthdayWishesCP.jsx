import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function BirthdayWishesCP() {
  const { user } = useAuth();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayBirthdays();
  }, []);

  const fetchTodayBirthdays = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE;
      
      // BDM ke name se filter karo
      const bdmName = user?.name || "";
      const url = `${API_BASE}/cp/birthdays/today?bdmName=${encodeURIComponent(bdmName)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setBirthdays(data.birthdays || []);
      }
    } catch (error) {
      console.error("Failed to fetch birthdays:", error);
      toast.error("Failed to load birthdays");
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppWish = (cp) => {
    const message = encodeURIComponent(
      `🎉 Happy Birthday ${cp.name}! 🎂\n\n` +
      `Wishing you a wonderful year filled with success, happiness, and prosperity. ` +
      `Thank you for being a valuable Channel Partner with VRN Inc.\n\n` +
      `May all your dreams come true! 🌟\n\n` +
      `Warm Regards,\n${user?.name || "Team"}\nVRN INC.`
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

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>🎂</span>
          <div>
            <h2 style={styles.title}>Birthday Wishes For CP</h2>
            <p style={styles.subtitle}>
              {loading ? "Loading..." : `Today's Birthdays: ${birthdays.length}`}
            </p>
          </div>
        </div>
        <button 
          style={styles.refreshBtn}
          onClick={fetchTodayBirthdays}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.emptyState}>
          <p>Loading birthdays...</p>
        </div>
      ) : birthdays.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🎈</span>
          <p style={styles.emptyText}>No birthdays today!</p>
          <p style={styles.emptySubtext}>Check back tomorrow 😊</p>
        </div>
      ) : (
        <div style={styles.birthdayList}>
          {birthdays.map((cp, index) => (
            <div key={index} style={styles.birthdayItem}>
              <div style={styles.cpInfo}>
                <div style={styles.avatar}>
                  {cp.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.cpDetails}>
                  <h3 style={styles.cpName}>{cp.name}</h3>
                  <div style={styles.cpMeta}>
                    <span style={styles.cpMetaItem}>
                      <i className="bi bi-telephone"></i> {cp.phone}
                    </span>
                    <span style={styles.cpMetaItem}>
                      <i className="bi bi-hash"></i> {cp.uniqueId}
                    </span>
                    <span style={styles.dealBadge}>{cp.dealType}</span>
                  </div>
                </div>
              </div>
              
              <div style={styles.actions}>
                <button
                  onClick={() => callCP(cp.phone)}
                  style={styles.callBtn}
                  title="Call"
                >
                  <i className="bi bi-telephone-fill"></i>
                </button>
                <button
                  onClick={() => sendWhatsAppWish(cp)}
                  style={styles.whatsappBtn}
                  title="Send WhatsApp Wish"
                >
                  <i className="bi bi-whatsapp"></i>
                  Send Wish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline Styles
const styles = {
  card: {
    background: "linear-gradient(135deg, #ff6b9d 0%, #c56cf0 50%, #667eea 100%)",
    padding: "24px",
    borderRadius: "16px",
    color: "white",
    margin: "20px 0",
    boxShadow: "0 8px 32px rgba(255, 107, 157, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  icon: {
    fontSize: "40px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
  },
  subtitle: {
    margin: "4px 0 0 0",
    opacity: 0.9,
    fontSize: "14px",
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "18px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "12px",
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    opacity: 0.8,
    margin: 0,
  },
  birthdayList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  birthdayItem: {
    background: "rgba(255,255,255,0.15)",
    padding: "16px",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  cpInfo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: "250px",
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
  },
  cpDetails: {
    flex: 1,
  },
  cpName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
  },
  cpMeta: {
    display: "flex",
    gap: "12px",
    marginTop: "6px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  cpMetaItem: {
    fontSize: "13px",
    opacity: 0.9,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  dealBadge: {
    background: "rgba(255,255,255,0.25)",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  callBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "white",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },
  whatsappBtn: {
    background: "#25D366",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
};

export default BirthdayWishesCP;
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/Process.css";

function CP_Page() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Lead Qualification Form",
      description: "Submit new Channel Partner leads",
      icon: "bi-file-earmark-check-fill",
      color: "#10b981",
      bgColor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      path: "/cp/lead-form",
      step: null,
    },
    {
      title: "Can Contact",
      description: "Leads that can be contacted",
      icon: "bi-telephone-forward-fill",
      color: "#6366f1",
      bgColor: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      path: "/cp/can-contact",
      step: 1,
    },
    {
      title: "Cannot Contact",
      description: "Leads that cannot be contacted",
      icon: "bi-telephone-x-fill",
      color: "#ec4899",
      bgColor: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
      path: "/cp/cannot-contact",
      step: 2,
    },
  ];

  const handleCardClick = (card) => {
    if (card.disabled) return;
    if (card.path) {
      navigate(card.path);
    }
  };

  return (
    <Layout breadcrumbs={[{ name: "CP NBD", path: "/cp" }]}>
      <div className="nbdin-container">
        {/* Background Elements */}
        <div className="nbdin-bg">
          <div className="nbdin-shape nbdin-shape-1"></div>
          <div className="nbdin-shape nbdin-shape-2"></div>
          <div className="nbdin-shape nbdin-shape-3"></div>
        </div>

        {/* Hero Section */}
        {/* <div className="nbdin-hero">
          <div className="nbdin-hero-content">
            <div className="nbdin-hero-badge">
              <i className="bi bi-briefcase-fill"></i>
              <span>Channel Partner Module</span>
            </div>
            <h1>CP NBD Management</h1>
            <p className="hero-subtitle">Manage Channel Partner leads and pipeline</p>
          </div>
          <div className="nbdin-hero-visual">
            <div className="hero-icon-stack">
              <div className="stack-item stack-1">
                <i className="bi bi-file-earmark-check"></i>
              </div>
              <div className="stack-item stack-2">
                <i className="bi bi-telephone"></i>
              </div>
              <div className="stack-item stack-3">
                <i className="bi bi-telephone-x"></i>
              </div>
              <div className="stack-item stack-4">
                <i className="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </div> */}

        {/* Cards Grid */}
        <div className="nbdin-cards-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`nbdin-card ${card.disabled ? "disabled" : ""}`}
              onClick={() => handleCardClick(card)}
              style={{ 
                animationDelay: `${index * 0.1}s`, 
                "--card-color": card.color 
              }}
            >

              {/* Count Badge (for Can Contact / Cannot Contact) */}
              {card.count !== undefined && (
                <div className="count-badge" style={{ background: card.bgColor }}>
                  <i className="bi bi-clipboard-data"></i>
                  <span>{card.count} Leads</span>
                </div>
              )}

              {/* Card Icon */}
              <div className="nbdin-card-icon-wrapper">
                <div 
                  className="nbdin-card-icon-bg" 
                  style={{ background: card.bgColor }}
                ></div>
                <div 
                  className="nbdin-card-icon" 
                  style={{ background: card.bgColor }}
                >
                  <i className={`bi ${card.icon}`}></i>
                </div>
              </div>

              {/* Card Content */}
              <div className="nbdin-card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>

              {/* Card Button */}
              <button
                className="nbdin-card-btn"
                style={{ background: card.disabled ? "#e2e8f0" : card.bgColor }}
                disabled={card.disabled}
              >
                <span>{card.disabled ? "Coming Soon" : "View"}</span>
                <i className="bi bi-arrow-right"></i>
              </button>

              {/* Hover Gradient */}
              <div 
                className="nbdin-card-gradient" 
                style={{ background: card.bgColor }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default CP_Page;
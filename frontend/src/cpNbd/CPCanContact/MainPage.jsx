import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import "../../assets/styles/Process.css";

function NbdIn() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Step 1: Follow-ups",
      description: "Initial follow-up with qualified leads",
      icon: "bi-telephone-outbound-fill",
      color: "#6366f1",
      bgColor: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      path: "/cp/can-contact/follow-up",
    },
    {
      title: "Step 2: Field Visit",
      description: "Schedule and track field visits",
      icon: "bi-geo-alt-fill",
      color: "#ec4899",
      bgColor: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
      path: "/cp/can-contact/field-visit",
    },
    {
      title: "Step 3: Follow-up",
      description: "Post field visit follow-up activities",
      icon: "bi-chat-dots-fill",
      color: "#f59e0b",
      bgColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      path: "/cp/can-contact/after-field-visit",
    },
    {
      title: "Step 4: Meeting ",
      description: "Schedule and manage meetings with leads",
      icon: "bi-rocket-takeoff-fill",
      color: "#8b5cf6",
      bgColor: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
      path: "/cp/can-contact/meetings",
    },
    //  {
    //   title: "Step 5: Booking",
    //   description: "Complete and confirm property bookings",
    //   icon: "bi-bookmark-check-fill",  
    //   color: "#10b981",  
    //   bgColor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    //   path: "/cp/can-contact/bookings",
    // },
  ];

  const handleCardClick = (card) => {
    if (card.disabled) return;
    if (card.onClick) {
      card.onClick();
    } else if (card.path) {
      navigate(card.path);
    }
  };

  return (
    <Layout breadcrumbs={[{ name: "CPCanConnect", path: "/nbd-in" }]}>
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
              <i className="bi bi-diagram-3-fill"></i>
              <span>Process Workflow</span>
            </div>
            <h1>Channel Partner</h1>
          </div>
          <div className="nbdin-hero-visual">
            <div className="hero-icon-stack">
              <div className="stack-item stack-1">
                <i className="bi bi-person-plus"></i>
              </div>
              <div className="stack-item stack-2">
                <i className="bi bi-telephone"></i>
              </div>
              <div className="stack-item stack-3">
                <i className="bi bi-geo-alt"></i>
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
              style={{ animationDelay: `${index * 0.1}s`, "--card-color": card.color }}
            >
              {/* Step Badge */}
              {card.step && (
                <div className="nbdin-step-badge" style={{ background: card.bgColor }}>
                  {card.disabled ? "Soon" : `Step ${card.step}`}
                </div>
              )}

              {/* External Link Indicator */}
              {card.isExternal && (
                <div className="external-indicator">
                  <i className="bi bi-box-arrow-up-right"></i>
                </div>
              )}

              {/* Card Icon */}
              <div className="nbdin-card-icon-wrapper">
                <div className="nbdin-card-icon-bg" style={{ background: card.bgColor }}></div>
                <div className="nbdin-card-icon" style={{ background: card.bgColor }}>
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
                <span>{card.disabled ? "Coming Soon" : card.isExternal ? "Open" : "View"}</span>
                <i className={`bi ${card.isExternal ? "bi-box-arrow-up-right" : "bi-arrow-right"}`}></i>
              </button>

              {/* Hover Gradient */}
              <div className="nbdin-card-gradient" style={{ background: card.bgColor }}></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default NbdIn;

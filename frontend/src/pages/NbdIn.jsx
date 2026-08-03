import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/Process.css";

function NbdIn() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Lead Qualified Form",
      description: "View and manage lead qualification dashboard",
      icon: "bi-file-earmark-check-fill",
      color: "#10b981",
      bgColor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      isExternal: true,
      onClick: () =>
        window.open(
          "https://script.google.com/macros/s/AKfycbyaP34d45T6bVqU3n27caG_7uwEobf7NZPnUauNhxTIk0_IbJPosyKOrhKiJq2BRBx1/exec?mode=dashboard",
          "_blank",
        ),
      step: null,
    },
    {
      title: "Step 1: Follow-ups",
      description: "Initial follow-up with qualified leads",
      icon: "bi-telephone-outbound-fill",
      color: "#6366f1",
      bgColor: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      path: "/nbd-in/NBD_IN",
      step: 1,
    },
    {
      // ✅ SPLIT CARD — Field Visit + CNP
      isSplit: true,
      step: 2,
      left: {
        title: "Field Visit",
        description: "Schedule & track visits",
        icon: "bi-geo-alt-fill",
        color: "#ec4899",
        bgColor: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
        path: "/nbd-in/field-visit",
      },
      right: {
        title: "Call Not Picked",
        description: "Leads not responding",
        icon: "bi-telephone-x-fill",
        color: "#0891b2",
        bgColor: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
        path: "/nbd-in/cnp",
      },
    },
    {
      title: "Step 3: Follow-up",
      description: "Post field visit follow-up activities",
      icon: "bi-chat-dots-fill",
      color: "#f59e0b",
      bgColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      path: "/nbd-in/followup",
      step: 3,
    },
    {
      title: "Step 4: Meeting ",
      description: "Schedule and manage meetings with leads",
      icon: "bi-rocket-takeoff-fill",
      color: "#8b5cf6",
      bgColor: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
      path: "/nbd-in/meeting",
      step: 4,
    },
  ];

  const handleCardClick = (card) => {
    if (card.disabled) return;
    if (card.onClick) {
      card.onClick();
    } else if (card.path) {
      navigate(card.path);
    }
  };

  const handleSplitHalfClick = (e, path) => {
    e.stopPropagation();
    if (path) navigate(path);
  };

  return (
    <Layout breadcrumbs={[{ name: "NBD IN", path: "/nbd-in" }]}>
      <div className="nbdin-container">
        {/* Background Elements */}
        <div className="nbdin-bg">
          <div className="nbdin-shape nbdin-shape-1"></div>
          <div className="nbdin-shape nbdin-shape-2"></div>
          <div className="nbdin-shape nbdin-shape-3"></div>
        </div>

       
        {/* <div className="nbdin-hero">
          <div className="nbdin-hero-content">
            <div className="nbdin-hero-badge">
              <i className="bi bi-diagram-3-fill"></i>
              <span>Process Workflow</span>
            </div>
            <h1>NBD IN</h1>
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
          {cards.map((card, index) => {
            // ✅ SPLIT CARD RENDERING
            if (card.isSplit) {
              return (
                <div
                  key={index}
                  className="nbdin-card nbdin-split-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Step Badge */}
                  {card.step && (
                    <div
                      className="nbdin-step-badge nbdin-split-step-badge"
                      style={{ background: card.left.bgColor }}
                    >
                      Step {card.step}
                    </div>
                  )}

                  <div className="nbdin-split-wrapper">
                    {/* LEFT HALF — Field Visit */}
                    <div
                      className="nbdin-split-half nbdin-split-left"
                      onClick={(e) => handleSplitHalfClick(e, card.left.path)}
                      style={{ "--half-color": card.left.color }}
                    >
                      <div
                        className="nbdin-split-icon"
                        style={{ background: card.left.bgColor }}
                      >
                        <i className={`bi ${card.left.icon}`}></i>
                      </div>
                      <h3>{card.left.title}</h3>
                      <p>{card.left.description}</p>
                      <button
                        className="nbdin-card-btn nbdin-split-btn"
                        style={{ background: card.left.bgColor }}
                        onClick={(e) =>
                          handleSplitHalfClick(e, card.left.path)
                        }
                      >
                        <span>View</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="nbdin-split-divider"></div>

                    {/* RIGHT HALF — CNP */}
                    <div
                      className="nbdin-split-half nbdin-split-right"
                      onClick={(e) => handleSplitHalfClick(e, card.right.path)}
                      style={{ "--half-color": card.right.color }}
                    >
                      <div
                        className="nbdin-split-icon"
                        style={{ background: card.right.bgColor }}
                      >
                        <i className={`bi ${card.right.icon}`}></i>
                      </div>
                      <h3>{card.right.title}</h3>
                      <p>{card.right.description}</p>
                      <button
                        className="nbdin-card-btn nbdin-split-btn"
                        style={{ background: card.right.bgColor }}
                        onClick={(e) =>
                          handleSplitHalfClick(e, card.right.path)
                        }
                      >
                        <span>View</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // ✅ NORMAL CARD RENDERING (unchanged)
            return (
              <div
                key={index}
                className={`nbdin-card ${card.disabled ? "disabled" : ""}`}
                onClick={() => handleCardClick(card)}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  "--card-color": card.color,
                }}
              >
                {card.step && (
                  <div
                    className="nbdin-step-badge"
                    style={{ background: card.bgColor }}
                  >
                    {card.disabled ? "Soon" : `Step ${card.step}`}
                  </div>
                )}

                {card.isExternal && (
                  <div className="external-indicator">
                    <i className="bi bi-box-arrow-up-right"></i>
                  </div>
                )}

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

                <div className="nbdin-card-content">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>

                <button
                  className="nbdin-card-btn"
                  style={{
                    background: card.disabled ? "#e2e8f0" : card.bgColor,
                  }}
                  disabled={card.disabled}
                >
                  <span>
                    {card.disabled
                      ? "Coming Soon"
                      : card.isExternal
                        ? "Open"
                        : "View"}
                  </span>
                  <i
                    className={`bi ${card.isExternal ? "bi-box-arrow-up-right" : "bi-arrow-right"}`}
                  ></i>
                </button>

                <div
                  className="nbdin-card-gradient"
                  style={{ background: card.bgColor }}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export default NbdIn;
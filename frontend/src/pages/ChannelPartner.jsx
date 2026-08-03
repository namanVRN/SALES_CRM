import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/ChannelPartner.css";

function ChannelPartner() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "CP Outgoing FMS",
      description:
        "Manage outgoing FMS processes and track channel partner activities",
      icon: "bi-arrow-up-right-circle-fill",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      onClick: () => navigate("/channel-partner/cp-outgoing"),
      isExternal: false,
    },
    {
      title: "CRR Followup",
      description: "View CRR followup dashboard and analytics reports",
      icon: "bi-chat-left-text-fill",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      onClick: () =>
        window.open("https://cp-checklist-frontend.vercel.app/", "_blank"),
      isExternal: true,
    },
  ];

  return (
    <Layout
      breadcrumbs={[{ name: "Channel Partner", path: "/channel-partner" }]}
    >
      <div className="cp-container">
        {/* Background Elements */}
        <div className="cp-bg">
          <div className="cp-shape cp-shape-1"></div>
          <div className="cp-shape cp-shape-2"></div>
        </div>

        {/* Header Section */}
        <div className="cp-header">
          <div className="cp-header-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="cp-header-content">
            <h1>Channel Partner</h1>
            <p>Manage your channel partner operations and follow-ups</p>
          </div>
        </div>

        {/* Stats Bar */}
        {/* <div className="cp-stats-bar">
          <div className="cp-stat">
            <i className="bi bi-collection-fill"></i>
            <span><strong>2</strong> Modules</span>
          </div>
          <div className="cp-stat">
            <i className="bi bi-lightning-charge-fill"></i>
            <span>Quick Access</span>
          </div>
          <div className="cp-stat">
            <i className="bi bi-shield-check"></i>
            <span>Secure</span>
          </div>
        </div> */}

        {/* Cards Grid */}
        <div className="cp-cards-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className="cp-card"
              onClick={card.onClick}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Card Glow Effect */}
              <div
                className="cp-card-glow"
                style={{ background: card.color }}
              ></div>

              {/* Card Content */}
              <div className="cp-card-inner">
                {/* Icon */}
                <div
                  className="cp-card-icon"
                  style={{ background: card.color }}
                >
                  <i className={`bi ${card.icon}`}></i>
                </div>

                {/* Text */}
                <div className="cp-card-text">
                  <h3>
                    {card.title}
                    {card.isExternal && (
                      <i className="bi bi-box-arrow-up-right external-icon"></i>
                    )}
                  </h3>
                  <p>{card.description}</p>
                </div>

                {/* Arrow */}
                <div className="cp-card-arrow">
                  <i className="bi bi-arrow-right-circle-fill"></i>
                </div>
              </div>

              {/* Hover Border */}
              <div
                className="cp-card-border"
                style={{
                  background: `linear-gradient(135deg, transparent 0%, ${card.color.split(",")[1]?.replace("100%)", "").trim() || "#764ba2"} 100%)`,
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        {/* <div className="cp-footer">
          <div className="cp-footer-item">
            <i className="bi bi-info-circle-fill"></i>
            <span>Click on any card to access the module</span>
          </div>
        </div> */}
      </div>
    </Layout>
  );
}

export default ChannelPartner;

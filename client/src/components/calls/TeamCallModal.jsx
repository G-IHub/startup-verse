import React, { useState } from "react";
import { Check, Mic, Video, X } from "lucide-react";

const PRIMARY = "var(--primary, #3A5AFE)";
const PRIMARY_DARK = "var(--primary-dark, #1A237E)";
const PRIMARY_TINT = "var(--primary-tint, #E8EBFF)";
const SURFACE_PAGE = "var(--surface-container-low, #FAFBFF)";
const SURFACE_BORDER = "var(--border, #E6E8F0)";
const TEXT_HEADING = "var(--text-heading, #0D0D0D)";
const TEXT_BODY = "var(--text-body, #4A4A5A)";
const TEXT_MUTED = "var(--text-muted, #A0A0B0)";

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(13, 13, 13, 0.52)",
    backdropFilter: "blur(4px)",
    fontFamily: "'Sora', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  modal: {
    position: "relative",
    width: "90%",
    maxWidth: "520px",
    padding: "0",
    borderRadius: "16px",
    border: `1px solid ${SURFACE_BORDER}`,
    background: "#FFFFFF",
    boxShadow: "0 24px 70px rgba(18, 24, 40, 0.24)",
    color: TEXT_HEADING,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "8px",
    background: SURFACE_PAGE,
    color: TEXT_BODY,
    cursor: "pointer",
  },
  header: {
    padding: "28px 72px 20px 28px",
    borderBottom: `1px solid ${SURFACE_BORDER}`,
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: 0,
    color: TEXT_HEADING,
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: "13px",
    lineHeight: 1.55,
    color: TEXT_BODY,
  },
  body: {
    padding: "24px 28px 28px",
    background: "#FFFFFF",
  },
  cards: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  iconWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: PRIMARY_TINT,
    color: PRIMARY,
    flexShrink: 0,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
  },
  checkBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    background: PRIMARY,
    color: "#FFFFFF",
  },
  cardTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1.3,
    color: TEXT_HEADING,
  },
  cardDescription: {
    margin: "6px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: TEXT_BODY,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  hint: {
    flex: 1,
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.4,
    color: TEXT_MUTED,
  },
  startButton: {
    width: "160px",
    height: "44px",
    border: "none",
    borderRadius: "10px",
    background: PRIMARY,
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(58, 90, 254, 0.24)",
  },
};

const callOptions = [
  {
    type: "voice",
    title: "Voice Call",
    description: "Audio only, lighter on data",
    Icon: Mic,
  },
  {
    type: "video",
    title: "Video Call",
    description: "Full video with audio",
    Icon: Video,
  },
];

function getCardStyle(isSelected) {
  return {
    flex: "1 1 190px",
    minWidth: 0,
    padding: "18px",
    border: `1.5px solid ${isSelected ? PRIMARY : SURFACE_BORDER}`,
    borderRadius: "12px",
    background: isSelected ? PRIMARY_TINT : SURFACE_PAGE,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    boxShadow: isSelected ? "0 10px 24px rgba(58, 90, 254, 0.12)" : "none",
  };
}

export default function TeamCallModal({ isOpen, onClose, onStart }) {
  const [selectedType, setSelectedType] = useState(null);

  if (!isOpen) {
    return null;
  }

  const isStartDisabled = !selectedType;

  function handleStart() {
    if (!selectedType) return;
    onStart?.(selectedType);
  }

  return (
    <div style={styles.overlay} onClick={onClose} role="presentation">
      <section
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-call-modal-title"
        aria-describedby="team-call-modal-subtitle"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          style={styles.closeButton}
          onClick={onClose}
          aria-label="Close team call modal"
        >
          <X size={18} strokeWidth={2.3} />
        </button>

        <header style={styles.header}>
          <h2 id="team-call-modal-title" style={styles.title}>
            Start a Team Call
          </h2>
          <p id="team-call-modal-subtitle" style={styles.subtitle}>
            Choose how you want to connect with your team
          </p>
        </header>

        <div style={styles.body}>
          <div style={styles.cards}>
            {callOptions.map(({ type, title, description, Icon }) => {
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  style={getCardStyle(isSelected)}
                  onClick={() => setSelectedType(type)}
                  aria-pressed={isSelected}
                >
                  <span style={styles.cardHeader}>
                    <span style={styles.iconWrap}>
                      <Icon size={20} strokeWidth={2.2} />
                    </span>
                    {isSelected && (
                      <span style={styles.checkBadge} aria-hidden="true">
                        <Check size={14} strokeWidth={2.6} />
                      </span>
                    )}
                  </span>
                  <h3 style={styles.cardTitle}>{title}</h3>
                  <p style={styles.cardDescription}>{description}</p>
                </button>
              );
            })}
          </div>

          <footer style={styles.footer}>
            <p style={styles.hint}>
              Your call starts in the workspace and can be shared with active team members.
            </p>
            <button
              type="button"
              style={{
                ...styles.startButton,
                background: isStartDisabled ? "#D8DCE8" : PRIMARY,
                color: isStartDisabled ? "#7A8194" : "#FFFFFF",
                boxShadow: isStartDisabled ? "none" : styles.startButton.boxShadow,
                opacity: isStartDisabled ? 1 : 1,
                cursor: isStartDisabled ? "not-allowed" : "pointer",
              }}
              disabled={isStartDisabled}
              onClick={handleStart}
            >
              Start Call
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}

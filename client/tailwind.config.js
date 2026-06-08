/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3a5afe",
          foreground: "#ffffff",
          hover: "#304ffe",
          dark: "#1a237e",
          tint: "#e8ebff",
        },
        accent: {
          DEFAULT: "#7c4dff",
          foreground: "#ffffff",
          tint: "#ede7f6",
          dark: "#4527a0",
        },
        /* Flat keys so utilities like text-primary-foreground resolve (not only CSS vars) */
        "primary-foreground": "#ffffff",
        "accent-foreground": "#ffffff",
        "destructive-foreground": "#ffffff",
        "secondary-foreground": "#0d0d0d",
        "card-foreground": "#0d0d0d",
        "popover-foreground": "#0d0d0d",
        text: {
          heading: "#0d0d0d",
          body: "#4a4a5a",
          muted: "#a0a0b0",
        },
        surface: {
          page: "#f4f5ff",
          card: "#ffffff",
          border: "#e2e4f0",
        },
        status: {
          success: "#00c896",
          warning: "#ffb300",
          error: "#ff4f6b",
        },
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
      borderRadius: {
        input: "10px",
        card: "14px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0, 0, 0, 0.06)",
        focus: "0 0 0 3px rgba(58, 90, 254, 0.10)",
        card: "0 4px 24px rgba(58, 90, 254, 0.08)",
        modal: "0 8px 40px rgba(58, 90, 254, 0.14)",
      },
      keyframes: {
        /* Opacity only — do not animate `transform` here: Tailwind v4 centers
           dialogs via the `translate` property (-50%/-50%), and keyframe
           `transform` composes with it and breaks centering (modal jumps top-left). */
        svModalCenteredIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        svModalCenteredOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        svModalPanelIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "sv-modal-centered-in": "svModalCenteredIn 0.2s ease forwards",
        "sv-modal-centered-out": "svModalCenteredOut 0.2s ease forwards",
        "sv-modal-panel-in": "svModalPanelIn 0.2s ease forwards",
      },
    },
  },
};

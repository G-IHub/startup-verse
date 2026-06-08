import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";
import { applyConsolePolicy } from "./utils/consolePolicy";
import { wipeLegacyStartupVerseStorage } from "./utils/clearLegacyClientStorage";

applyConsolePolicy();
wipeLegacyStartupVerseStorage();

// Light-only: strip legacy dark class from persisted HTML (old theme toggle)
document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);

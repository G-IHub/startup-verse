import "./config/sentry.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@sentry/react";
import App from "./App";
import "./index.css";
import SentryErrorFallback from "./components/SentryErrorFallback";
import { applyConsolePolicy } from "./utils/consolePolicy";
import { wipeLegacyStartupVerseStorage } from "./utils/clearLegacyClientStorage";

applyConsolePolicy();
wipeLegacyStartupVerseStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary fallback={<SentryErrorFallback />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

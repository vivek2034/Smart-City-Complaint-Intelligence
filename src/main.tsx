import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle benign HMR/Vite/WebSocket errors gracefully in the sandboxed preview
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    if (
      reason.includes("WebSocket") || 
      reason.includes("websocket") || 
      reason.includes("HMR") ||
      reason.includes("offline")
    ) {
      event.preventDefault();
      console.warn("[Benign Ignored Rejection]:", reason);
    }
  });

  window.addEventListener("error", (event) => {
    const message = event.message || "";
    if (
      message.includes("WebSocket") || 
      message.includes("websocket") ||
      message.includes("HMR")
    ) {
      event.preventDefault();
      console.warn("[Benign Ignored Error]:", message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


import React, { StrictMode, Component } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[ErrorBoundary] caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '40px auto',
          backgroundColor: '#FFF5F5',
          border: '1px solid #FEB2B2',
          color: '#9B2C2C',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }} id="error-boundary-screen">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Portal Diagnostic Alert</h1>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>The portal encountered a critical initialization or database routing exception:</p>
          <pre style={{
            backgroundColor: '#FFF',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #FED7D7',
            fontSize: '12px',
            overflow: 'auto',
            fontFamily: 'monospace',
            maxHeight: '300px',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: '#E53E3E',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload Gateway Portal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Proactively purge old caches once on startup to ensure no stale assets are used
try {
  if (typeof window !== "undefined" && "caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key).then(() => {
          console.log("[PWA Cache Clean] Purged stale cache:", key);
        });
      });
    });
  }
} catch (e) {
  console.warn("[PWA Cache Clean] Failed:", e);
}

// Register Service Worker for PWA Offline Caching and Mobile Push Notifications
try {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA Service Worker] Registered successfully for Mobile Push Alerts:", registration);
        })
        .catch((err) => {
          console.warn("[PWA Service Worker] Registration failed:", err);
        });
    });
  }
} catch (err) {
  console.warn("[PWA Service Worker] Check failed:", err);
}

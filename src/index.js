import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// App version - increment this to force cache refresh for all users
const APP_VERSION = '2.5.1';

// Register Service Worker for PWA/Offline functionality with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✓ ServiceWorker registered:', registration.scope);
      
      // Check for updates immediately
      registration.update();
      
      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New ServiceWorker installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - skip waiting and activate immediately
            console.log('🆕 New version available! Activating...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      
      // Reload page when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('🔄 Refreshing page for new version...');
          window.location.reload();
        }
      });
      
    } catch (error) {
      console.log('✗ ServiceWorker registration failed:', error);
    }
  });
  
  // Store app version and check on load
  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion !== APP_VERSION) {
    console.log(`📦 App updated: ${storedVersion || 'none'} → ${APP_VERSION}`);
    localStorage.setItem('app_version', APP_VERSION);
    
    // Clear old caches if version changed
    if (storedVersion && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
          console.log('🗑️ Cleared cache:', name);
        });
      });
    }
  }
}

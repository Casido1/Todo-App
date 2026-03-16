import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker Registration with instant update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered!', reg);

      // Check for updates frequently (every 60 seconds)
      setInterval(() => reg.update(), 60 * 1000);

      // When a new service worker is found, force it to activate and reload
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        console.log('New SW update found, installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('New SW activated — reloading for latest version.');
            window.location.reload();
          }
        });
      });

      // If a service worker is already controlling the page but is not the current one,
      // reload to get the freshest content
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('Controller changed — reloading for latest version.');
          window.location.reload();
        }
      });

    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}

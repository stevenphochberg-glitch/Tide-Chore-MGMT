import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { FlowSettingsProvider } from './context/FlowSettingsContext.tsx';
import './index.css';

// Register PWA service worker for installability and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Tide PWA Service Worker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('Tide Service Worker registration skipped:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlowSettingsProvider>
      <App />
    </FlowSettingsProvider>
  </StrictMode>
);


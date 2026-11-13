import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Progressive Web App (PWA) Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('MarkItDown PWA ServiceWorker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.warn('MarkItDown PWA ServiceWorker registration failed:', error);
      });
  });
}

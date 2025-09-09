import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'leaflet/dist/leaflet.css';
import "@fontsource/vazirmatn";
import App from './App';

// اضافه کردن PWA Service Worker
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

// ===== Fix mobile 100vh issue =====
function setAppVhVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--app-vh', `${vh}px`);
}
setAppVhVar();
window.addEventListener('resize', setAppVhVar);
window.addEventListener('orientationchange', () => setTimeout(setAppVhVar, 150));
// ==================================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

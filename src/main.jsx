import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker: solo en producción. En desarrollo causa más problemas que
// resuelve (cachea bundles viejos y oculta cambios del HMR).
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  } else {
    // Si veníamos de una build previa, desregistra el SW para evitar caché stale en dev.
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
  }
}

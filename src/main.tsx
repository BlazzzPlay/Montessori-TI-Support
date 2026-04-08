import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root') as HTMLElement
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered')
        // Escuchar mensaje del SW cuando se activa una versión nueva
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            console.log('[SW] Nueva versión detectada — recargando...')
            // Pequeño delay para que el SW termine de activarse
            setTimeout(() => window.location.reload(), 200)
          }
        })
        // Verificar actualizaciones cada vez que el usuario vuelve a la pestaña
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {})
          }
        })
      })
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}


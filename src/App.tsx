import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, ToastProvider } from './contexts/ThemeContext'
import { LoginPage } from './pages/LoginPage'
import { TasksPage } from './pages/TasksPage'
import { TVPage } from './pages/TVPage'
import { AuditoriaPage } from './pages/AuditoriaPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'
import { SolicitudPage } from './pages/SolicitudPage'
import { ReservaTabletsPage } from './pages/ReservaTabletsPage'
import type { ReactNode } from 'react'

// Route guard — redirects to /login if not authenticated
// Rutas públicas (sin auth): /tv, /auditoria
function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Cargando...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  // Demo mode: if no auth configured (mock mode), let through
  if (!user && import.meta.env.VITE_INSFORGE_ANON_KEY) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      {/* Rutas públicas — accesibles sin autenticación, ideales para TVs y compartir */}
      <Route path="/tv" element={<TVPage />} />
      <Route path="/auditoria" element={<AuditoriaPage />} />
      <Route path="/solicitud" element={<SolicitudPage />} />
      {/* Rutas privadas */}
      <Route path="/" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
      <Route path="/tablets" element={<PrivateRoute><ReservaTabletsPage /></PrivateRoute>} />
      <Route path="/configuracion" element={<PrivateRoute><ConfiguracionPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import type { Tarea } from '../../types'

interface SidebarProps {
  tareas: Tarea[]
  isOpen?: boolean
  onClose?: () => void
}

const NAV_ITEMS = [
  { path: '/',               icon: '📋', label: 'Tareas',         badge: (t: Tarea[]) => t.filter(x => x.estado !== 'cerrado' && x.prioridad === 'urgente').length },
  { path: '/auditoria',     icon: '📊', label: 'Auditoría',       badge: () => 0, external: true },
  { path: '/tv',             icon: '📺', label: 'Panel TV',        badge: () => 0, external: true },
  { path: '/configuracion', icon: '⚙️', label: 'Configuración',   badge: () => 0 },
]

export function Sidebar({ tareas, isOpen = false, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
  }

  const pendingUrgentes = tareas.filter(t => t.prioridad === 'urgente' && (t.estado === 'pendiente' || t.estado === 'en_progreso')).length
  const totalPending = tareas.filter(t => t.estado === 'pendiente').length

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Navegación principal">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">🖥️</div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">TI Montessori</div>
            <div className="sidebar-logo-sub">Dpto. Informática</div>
          </div>
        </div>

        {/* Stats summary */}
        <div style={{ padding: '0.75rem', margin: '0.75rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-500)' }}>{totalPending}</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pendientes</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pendingUrgentes > 0 ? 'var(--priority-urgente)' : 'var(--text-muted)' }}>{pendingUrgentes}</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Urgentes</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--priority-baja)' }}>{tareas.filter(t => t.estado === 'resuelto').length}</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resueltas</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" role="navigation">
          <div className="sidebar-section-label">Módulos</div>
          {NAV_ITEMS.map(item => {
            const badge = item.badge(tareas)
            const isActive = location.pathname === item.path
            if (item.external) {
              return (
                <a key={item.path} href={item.path} className={`nav-item ${isActive ? 'active' : ''}`} target="_blank" rel="noopener noreferrer">
                  <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>↗</span>
                </a>
              )
            }
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive: a }) => `nav-item ${a ? 'active' : ''}`} onClick={onClose}>
                <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
                {badge > 0 && <span className="nav-item-badge">{badge}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar" aria-hidden="true">
            {(user?.nombre ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.nombre ?? 'Técnico TI'}</div>
            <div className="user-role">{user?.email ?? 'Informática Escolar'}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={toggleTheme}
              title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={handleSignOut}
              disabled={signingOut}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { Tarea } from '../../types'

interface AppLayoutProps {
  children: ReactNode
  tareas: Tarea[]
  onNewTask?: () => void
}

export function AppLayout({ children, tareas, onNewTask }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar tareas={tareas} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Mobile TopBar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            style={{ display: 'none', border: 'none', background: 'transparent', fontSize: '1.5rem' }}
            id="mobile-menu-btn"
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span style={{ fontSize: '1.25rem', display: 'none' }} id="mobile-logo-emoji">🖥️</span>
             <div id="topbar-title" style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TI Montessori</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            {onNewTask && (
              <button className="btn btn-primary btn-sm" onClick={onNewTask} id="topbar-new-task-btn" style={{ fontWeight: 700 }}>
                + Nueva
              </button>
            )}
          </div>
        </header>

        <main id="main" role="main" style={{ flex: 1, position: 'relative' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-btn { display: flex !important; }
          #mobile-logo-emoji { display: block !important; }
        }
      `}</style>
    </div>
  )
}

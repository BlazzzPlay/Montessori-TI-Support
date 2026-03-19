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
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            ☰
          </button>
          <div id="topbar-title" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            {onNewTask && (
              <button className="btn btn-primary btn-sm" onClick={onNewTask} id="topbar-new-task-btn">
                + Nueva Tarea
              </button>
            )}
          </div>
        </header>

        <main id="main" role="main" style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

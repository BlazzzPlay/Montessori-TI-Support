import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskModal } from '../components/tasks/TaskModal'
import { AIAssistant } from '../components/ai/AIAssistant'
import { useTareas } from '../hooks/useTareas'
import { useHelpCounters } from '../hooks/useHelpCounters'
import { useToast } from '../contexts/ThemeContext'
import { STATUS_LABELS, PRIORITY_ORDER } from '../lib/utils'
import type { Tarea, EstadoTarea, Prioridad } from '../types'

const COLUMNS: { id: EstadoTarea; color: string; emoji: string }[] = [
  { id: 'pendiente',   color: '#94A3B8', emoji: '○' },
  { id: 'en_progreso', color: '#3B82F6', emoji: '◉' },
  { id: 'resuelto',    color: '#22C55E', emoji: '●' },
  { id: 'cerrado',     color: '#64748B', emoji: '✓' },
]

type ViewMode = 'kanban' | 'lista'

export function TasksPage() {
  const { tareas, etiquetas, loading, createTarea, updateTarea, deleteTarea } = useTareas()
  const { helpCounters, incrementCounter } = useHelpCounters()
  const { addToast } = useToast()

  const [view, setView] = useState<ViewMode>('kanban')
  const [selectedTareaId, setSelectedTareaId] = useState<string | undefined>()
  const selectedTarea = useMemo(() => tareas.find(t => t.id === selectedTareaId), [tareas, selectedTareaId])
  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState<Prioridad | 'all'>('all')
  const [filterEtiqueta, setFilterEtiqueta] = useState<string | 'all'>('all')

  const filtered = useMemo(() => {
    let res = tareas.filter(t => t.estado !== 'solicitud')
    if (searchText) {
      const q = searchText.toLowerCase()
      res = res.filter(t =>
        t.titulo.toLowerCase().includes(q) ||
        t.solicitante.toLowerCase().includes(q) ||
        t.ubicacion?.toLowerCase().includes(q) ||
        t.descripcion?.toLowerCase().includes(q)
      )
    }
    if (filterPrioridad !== 'all') res = res.filter(t => t.prioridad === filterPrioridad)
    if (filterEtiqueta !== 'all') res = res.filter(t => t.etiquetas?.some(e => e.id === filterEtiqueta))
    return res.sort((a, b) => PRIORITY_ORDER[a.prioridad] - PRIORITY_ORDER[b.prioridad])
  }, [tareas, searchText, filterPrioridad, filterEtiqueta])

  const byStatus = (estado: EstadoTarea) => filtered.filter(t => t.estado === estado)
  const solicitudes = tareas.filter(t => t.estado === 'solicitud').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const openCreate = () => { setSelectedTareaId(undefined); setShowModal(true) }
  const openEdit = (t: Tarea) => {
    setSelectedTareaId(t.id)
    setShowModal(true)
    // Marcar todos los mensajes no-leídos como leídos al abrir
    const tieneNoLeidos = (t.comentarios || []).some(c => !c.es_admin && !c.leido_por_admin)
    if (tieneNoLeidos) {
      const comentariosLeidos = (t.comentarios || []).map(c =>
        !c.es_admin ? { ...c, leido_por_admin: true } : c
      )
      updateTarea(t.id, { comentarios: comentariosLeidos })
    }
  }
  const closeModal = () => { setShowModal(false); setSelectedTareaId(undefined) }

  const handleCreate = async (data: Parameters<typeof createTarea>[0]) => {
    const res = await createTarea(data)
    if (!res.error) addToast('✓ Tarea creada exitosamente', 'success')
    return res
  }

  const handleUpdate = async (id: string, data: Partial<Tarea>) => {
    const res = await updateTarea(id, data)
    if (!res.error) addToast('✓ Tarea actualizada', 'success')
    return res
  }

  const handleDelete = async (id: string) => {
    const res = await deleteTarea(id)
    if (!res.error) addToast('🗑 Tarea eliminada', 'info')
    return res
  }

  if (loading) return (
    <AppLayout tareas={[]} onNewTask={openCreate}>
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout tareas={tareas} onNewTask={openCreate}>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestión de Tareas</h1>
            <p className="page-subtitle">
              <span style={{ fontSize: '0.625rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(234,179,8,0.12)', color: '#D97706', fontWeight: 700, marginRight: '0.5rem', border: '1px solid rgba(234,179,8,0.3)' }}>PRIVADO</span>
              {tareas.filter(t=>t.estado!=='cerrado' && t.estado!=='solicitud').length} tareas activas · {tareas.filter(t=>t.prioridad==='urgente'&&t.estado==='pendiente').length} urgentes
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="tabs">
              <button className={`tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>🗂 Kanban</button>
              <button className={`tab ${view === 'lista' ? 'active' : ''}`} onClick={() => setView('lista')}>☰ Lista</button>
            </div>
            <button className="btn btn-primary" onClick={openCreate} id="new-task-btn">+ Nueva</button>
          </div>
        </div>

        {/* Tareas Rápidas (Help Counters) */}
        <div style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 3vw, 1.25rem)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> Tareas Rápidas (Mensual)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(0.5rem, 2vw, 1rem)' }}>
            {[
              { key: 'apoderados', label: 'Apoderados', color: '#3B82F6', icon: '👨‍👩‍👧‍👦' },
              { key: 'alumnos', label: 'Alumnos', color: '#10B981', icon: '🎓' },
              { key: 'profesores', label: 'Profesores', color: '#F59E0B', icon: '👨‍🏫' },
              { key: 'administrativos', label: 'Administrativos', color: '#6366F1', icon: '🏢' }
            ].map(item => (
              <button
                key={item.key} 
                className="btn btn-secondary"
                onClick={() => incrementCounter(item.key)}
                style={{
                  height: 'auto', display: 'flex', flexDirection: 'column', gap: '6px',
                  padding: '12px 8px', border: `1px solid ${item.color}30`, background: `${item.color}05`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>{helpCounters[item.key as keyof typeof helpCounters]}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Solicitudes Pendientes Panel */}
        {solicitudes.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📥 Solicitudes Pendientes <span style={{ background: 'var(--brand-500)', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem' }}>{solicitudes.length}</span>
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nuevos requerimientos ingresados por profesores y administrativos.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {solicitudes.map(t => (
                <div key={t.id} style={{ minWidth: 280, maxWidth: 320, flexShrink: 0 }}>
                  <TaskCard tarea={t} onClick={openEdit} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filter-bar">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
          <input
            className="input"
            type="search"
            placeholder="Buscar por título, solicitante, ubicación..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            aria-label="Buscar tareas"
          />
          <div className="filter-divider" />
          <select className="select" style={{ width: 'auto', background: 'transparent', border: 'none', fontSize: '0.875rem', color: 'var(--text-secondary)' }} value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value as typeof filterPrioridad)} aria-label="Filtrar por prioridad">
            <option value="all">Todas las prioridades</option>
            <option value="urgente">🔴 Urgente</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>
          <div className="filter-divider" />
          <select className="select" style={{ width: 'auto', background: 'transparent', border: 'none', fontSize: '0.875rem', color: 'var(--text-secondary)' }} value={filterEtiqueta} onChange={e => setFilterEtiqueta(e.target.value)} aria-label="Filtrar por etiqueta">
            <option value="all">Todas las etiquetas</option>
            {etiquetas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>

        {/* Kanban View */}
        {view === 'kanban' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kanban-board">
            {COLUMNS.map(col => {
              const tasks = byStatus(col.id)
              return (
                <div key={col.id} className="kanban-column">
                  <div className="kanban-column-header">
                    <div className="kanban-column-title" style={{ color: col.color }}>
                      <span>{col.emoji}</span>
                      {STATUS_LABELS[col.id]}
                    </div>
                    <span className="kanban-column-count">{tasks.length}</span>
                  </div>
                  <AnimatePresence>
                    {tasks.map((t, i) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <TaskCard tarea={t} onClick={openEdit} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {tasks.length === 0 && (
                    <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                      <div className="empty-state-icon" style={{ fontSize: '1.75rem' }}>{col.emoji}</div>
                      <div className="empty-state-desc" style={{ fontSize: '0.8125rem' }}>Sin tareas {STATUS_LABELS[col.id].toLowerCase()}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}

        {/* List View */}
        {view === 'lista' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Solicitante</th>
                    <th>Ubicación</th>
                    <th>Fecha límite</th>
                    <th>Etiquetas</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} onClick={() => openEdit(t)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {t.titulo}
                          {(t.comentarios?.length || 0) > 0 && (
                            <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: 99, background: `rgba(99, 102, 241, 0.1)`, color: '#6366f1', border: `1px solid rgba(99, 102, 241, 0.3)`, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                               💬 {t.comentarios?.length}
                            </span>
                          )}
                        </div>
                        {t.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.descripcion.slice(0,60)}…</div>}
                      </td>
                      <td><span className={`priority-badge priority-${t.prioridad}`}>{t.prioridad}</span></td>
                      <td><span className={`status-badge status-${t.estado}`}>{STATUS_LABELS[t.estado]}</span></td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t.solicitante}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.ubicacion ?? '—'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString('es-CL') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {t.etiquetas?.slice(0,2).map(e => (
                            <span key={e.id} style={{ fontSize: '0.625rem', padding: '1px 6px', borderRadius: '99px', background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}35`, fontWeight: 600 }}>
                              {e.nombre}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">Sin resultados</div>
                  <div className="empty-state-desc">Prueba con otros filtros o crea una nueva tarea.</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          tarea={selectedTarea}
          etiquetas={etiquetas}
          onClose={closeModal}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* AI Assistant */}
      <AIAssistant tareas={tareas} />
    </AppLayout>
  )
}

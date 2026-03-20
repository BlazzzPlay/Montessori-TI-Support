import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useTareas } from '../hooks/useTareas'
import { useEtiquetas } from '../hooks/useEtiquetas'
import { useToast } from '../contexts/ThemeContext'
import type { Etiqueta } from '../types'

// ──────────────────────────────────────────────────
// Colores predefinidos para seleccionar
// ──────────────────────────────────────────────────
const PRESET_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#D97706', '#16A34A', '#0891B2',
  '#6B7280', '#1E40AF', '#7E22CE', '#065F46',
]

const PRESET_ICONOS = ['🔧', '💻', '🌐', '📺', '🔌', '📱', '🖨️', '⚙️', '🗄️', '📡', '🔑', '🛡️']

// ──────────────────────────────────────────────────
// Modal para crear / editar etiqueta
// ──────────────────────────────────────────────────
interface EtiquetaModalProps {
  etiqueta?: Etiqueta
  onClose: () => void
  onSave: (fields: Omit<Etiqueta, 'id'>) => Promise<{ error?: string }>
}

function EtiquetaModal({ etiqueta, onClose, onSave }: EtiquetaModalProps) {
  const [nombre, setNombre] = useState(etiqueta?.nombre ?? '')
  const [color, setColor] = useState(etiqueta?.color ?? PRESET_COLORS[0])
  const [icono, setIcono] = useState(etiqueta?.icono ?? PRESET_ICONOS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setLoading(true)
    setError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await onSave({ nombre: nombre.trim().toLowerCase() as any, color, icono })
    setLoading(false)
    if (res.error) setError(res.error)
    else onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{ maxWidth: 460 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">{etiqueta ? '✏️ Editar Etiqueta' : '🏷️ Nueva Etiqueta'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', border: `2px solid ${color}40` }}>
            <span style={{ fontSize: '1.5rem' }}>{icono}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '3px 12px', borderRadius: 99, background: `${color}20`, color, border: `1px solid ${color}50` }}>
              {nombre || 'vista previa'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="et-nombre">Nombre de la etiqueta</label>
            <input
              id="et-nombre" className="input" type="text"
              placeholder="ej.: soporte, redes, audiovisual..."
              value={nombre} onChange={e => setNombre(e.target.value)}
              maxLength={32} autoFocus
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Se guardará en minúsculas. {nombre.length}/32
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? `3px solid ${c}` : '2px solid transparent',
                    outlineOffset: 2, transition: 'transform 0.1s', transform: color === c ? 'scale(1.2)' : 'scale(1)'
                  }}
                  title={c}
                  aria-label={`Color ${c}`}
                />
              ))}
              <input
                type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-default)', cursor: 'pointer', padding: 0, background: 'transparent' }}
                title="Color personalizado"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ícono</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {PRESET_ICONOS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcono(ic)}
                  style={{
                    width: 38, height: 38, borderRadius: 8, fontSize: '1.25rem', cursor: 'pointer',
                    background: icono === ic ? `${color}20` : 'var(--bg-raised)',
                    border: icono === ic ? `2px solid ${color}` : '2px solid var(--border-subtle)',
                    transition: 'all 0.15s'
                  }}
                  aria-label={`Ícono ${ic}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', color: '#EF4444', fontSize: '0.875rem' }}>
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !nombre.trim()}>
            {loading ? '⏳ Guardando...' : etiqueta ? '✓ Guardar cambios' : '+ Crear etiqueta'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// Página de Configuración
// ──────────────────────────────────────────────────
export function ConfiguracionPage() {
  const { tareas, etiquetas, refetch } = useTareas()
  const { addToast } = useToast()
  const { loading: etLoading, createEtiqueta, updateEtiqueta, deleteEtiqueta } = useEtiquetas(etiquetas, refetch)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEt, setEditingEt] = useState<Etiqueta | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'etiquetas' | 'info'>('etiquetas')

  // Cuántas tareas usa cada etiqueta
  const usageCount = (etId: string) => tareas.filter(t => t.etiquetas?.some(e => e.id === etId)).length

  const openCreate = () => { setEditingEt(undefined); setModalOpen(true) }
  const openEdit   = (et: Etiqueta) => { setEditingEt(et); setModalOpen(true) }

  const handleSave = async (fields: Omit<Etiqueta, 'id'>) => {
    if (editingEt) {
      const res = await updateEtiqueta(editingEt.id, fields)
      if (!res.error) addToast('✓ Etiqueta actualizada', 'success')
      return res
    } else {
      const res = await createEtiqueta(fields)
      if (!res.error) addToast('✓ Etiqueta creada', 'success')
      return res
    }
  }

  const handleDelete = async (id: string) => {
    const n = usageCount(id)
    if (n > 0) {
      const ok = window.confirm(`Esta etiqueta está en uso por ${n} tarea(s). ¿Eliminarla igual? Se quitará de todas las tareas.`)
      if (!ok) return
    }
    setDeletingId(id)
    const res = await deleteEtiqueta(id)
    setDeletingId(null)
    if (!res.error) addToast('🗑 Etiqueta eliminada', 'info')
    else addToast(`Error: ${res.error}`, 'error')
  }

  return (
    <AppLayout tareas={tareas}>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Configuración</h1>
            <p className="page-subtitle">Administra las etiquetas y preferencias del sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab ${activeSection === 'etiquetas' ? 'active' : ''}`} onClick={() => setActiveSection('etiquetas')}>
            🏷️ Etiquetas
          </button>
          <button className={`tab ${activeSection === 'info' ? 'active' : ''}`} onClick={() => setActiveSection('info')}>
            ℹ️ Sistema
          </button>
        </div>

        {/* ── Sección Etiquetas ── */}
        {activeSection === 'etiquetas' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Etiquetas disponibles</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Las etiquetas permiten categorizar y filtrar las tareas del departamento.
                </p>
              </div>
              <button className="btn btn-primary" onClick={openCreate} id="create-tag-btn">
                + Nueva etiqueta
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {etiquetas.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🏷️</div>
                  <div className="empty-state-title">Sin etiquetas</div>
                  <div className="empty-state-desc">Crea la primera etiqueta para categorizar las tareas.</div>
                </div>
              )}
              <AnimatePresence>
                {etiquetas.map(et => {
                  const count = usageCount(et.id)
                  return (
                    <motion.div
                      key={et.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: `4px solid ${et.color}`,
                        borderRadius: 'var(--radius-md)',
                        transition: 'box-shadow 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{et.icono}</span>

                      <span style={{
                        padding: '4px 14px', borderRadius: 99, fontSize: '0.875rem', fontWeight: 700,
                        background: `${et.color}18`, color: et.color, border: `1px solid ${et.color}35`
                      }}>
                        {et.nombre}
                      </span>

                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                        {count > 0 ? `${count} tarea${count !== 1 ? 's' : ''}` : 'Sin uso aún'}
                      </span>

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.375rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(et)}
                          disabled={etLoading}
                          title="Editar etiqueta"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(et.id)}
                          disabled={etLoading || deletingId === et.id}
                          title="Eliminar etiqueta"
                          style={{ color: '#EF4444' }}
                        >
                          {deletingId === et.id ? '⏳' : '🗑'}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}


        {/* ── Sección Info del Sistema ── */}
        {activeSection === 'info' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {[
                { icon: '📋', label: 'Total de tareas', value: tareas.length },
                { icon: '🏷️', label: 'Etiquetas definidas', value: etiquetas.length },
                { icon: '✅', label: 'Resueltas / Cerradas', value: tareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado').length },
                { icon: '⏳', label: 'Pendientes activas', value: tareas.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso').length },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>🔗 URLs del sistema</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { label: 'Dashboard de Tareas (privado)', url: '/' },
                  { label: 'Panel TV (público)', url: '/tv' },
                  { label: 'Dashboard de Auditoría (público)', url: '/auditoria' },
                  { label: 'Formulario de Solicitud (público)', url: '/solicitud' },
                ].map(item => (
                  <div key={item.url} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--brand-500)', fontFamily: 'monospace' }}>
                      {window.location.origin}{item.url} ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              💡 <strong>TI Montessori v1.1</strong> · Conectado a InsForge ({import.meta.env.VITE_INSFORGE_ANON_KEY ? '✅ API configurada' : '⚠️ Modo demo — configura VITE_INSFORGE_ANON_KEY'})
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal etiqueta */}
      <AnimatePresence>
        {modalOpen && (
          <EtiquetaModal
            etiqueta={editingEt}
            onClose={() => { setModalOpen(false); setEditingEt(undefined) }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

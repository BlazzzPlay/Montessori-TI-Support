import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TagBadge, PRIORIDAD_OPTIONS, ESTADO_OPTIONS } from '../ui/Badges'
import { formatDateTime } from '../../lib/utils'
import type { Tarea, Etiqueta, TareaFormData } from '../../types'

interface TaskModalProps {
  tarea?: Tarea
  etiquetas: Etiqueta[]
  ubicaciones?: string[]   // lista precargada para el combobox
  onClose: () => void
  onCreate?: (data: TareaFormData) => Promise<{ error?: string }>
  onUpdate?: (id: string, data: Partial<Tarea>) => Promise<{ error?: string }>
  onDelete?: (id: string) => Promise<{ error?: string }>
}

export function TaskModal({  tarea,
  etiquetas,
  onClose, onCreate, onUpdate, onDelete }: TaskModalProps) {
  const isEdit = Boolean(tarea)
  const [form, setForm] = useState<TareaFormData>({
    titulo: tarea?.titulo ?? '',
    descripcion: tarea?.descripcion ?? '',
    solicitante: tarea?.solicitante ?? '',
    ubicacion: tarea?.ubicacion ?? '',
    prioridad: tarea?.prioridad ?? 'media',
    fecha_limite: tarea?.fecha_limite ? tarea.fecha_limite.split('T')[0] : '',
    etiqueta_ids: tarea?.etiquetas?.map(e => e.id) ?? [],
    mostrar_auditoria: tarea?.mostrar_auditoria ?? true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (key: keyof TareaFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const toggleTag = (id: string) =>
    setForm(prev => ({
      ...prev,
      etiqueta_ids: prev.etiqueta_ids.includes(id)
        ? prev.etiqueta_ids.filter(x => x !== id)
        : [...prev.etiqueta_ids, id]
    }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.solicitante.trim()) {
      setError('El título y el solicitante son requeridos.')
      return
    }
    setLoading(true)
    setError('')
    const result = isEdit && tarea
      ? await onUpdate?.(tarea.id, { ...form, fecha_limite: form.fecha_limite || undefined })
      : await onCreate?.(form)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    onClose()
  }

  const handleDelete = async () => {
    if (!tarea) return
    setLoading(true)
    await onDelete?.(tarea.id)
    setLoading(false)
    onClose()
  }

  const handleStatusChange = async (estado: string) => {
    if (!tarea || !onUpdate) return
    const extra = estado === 'resuelto' || estado === 'cerrado'
      ? { resuelto_at: new Date().toISOString() }
      : { resuelto_at: undefined }
    await onUpdate(tarea.id, { estado: estado as Tarea['estado'], ...extra })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div
          className="modal"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-header">
            <div>
              <h2 className="modal-title" id="modal-title">{isEdit ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}</h2>
              {isEdit && tarea && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Creada: {formatDateTime(tarea.created_at)}
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Alert for solicitudes */}
              {isEdit && tarea?.estado === 'solicitud' && (
                <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <strong>📥 Esta es una nueva solicitud.</strong> Para aprobarla y agregarla al tablero, completa los datos faltantes (etiquetas, fecha límite) y cambia su estado a <strong>Pendiente</strong> u otra fase.
                </div>
              )}

              {/* Status quick-change (edit only) */}
              {isEdit && tarea && (
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ESTADO_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        className={`pill ${tarea.estado === o.value ? 'active' : ''}`}
                        onClick={() => handleStatusChange(o.value)}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Titulo */}
              <div className="form-group">
                <label className="form-label required" htmlFor="titulo">Título</label>
                <input id="titulo" className="input" type="text" placeholder="Ej: Proyector sin señal en Sala A-203" value={form.titulo} onChange={set('titulo')} maxLength={120} />
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label className="form-label" htmlFor="descripcion">Descripción</label>
                <textarea id="descripcion" className="textarea" placeholder="Detalla el problema o requerimiento..." value={form.descripcion} onChange={set('descripcion')} maxLength={1000} />
              </div>

              {/* Solicitante + Ubicación */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label required" htmlFor="solicitante">Solicitante</label>
                  <input id="solicitante" className="input" type="text" placeholder="Prof. o Administrativo" value={form.solicitante} onChange={set('solicitante')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ubicacion">Ubicación</label>
                  <input
                    id="ubicacion"
                    className="input"
                    type="text"
                    placeholder="Ej: Sala A-203..."
                    value={form.ubicacion}
                    onChange={set('ubicacion')}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Prioridad + Fecha + Visibilidad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prioridad">Prioridad</label>
                  <select id="prioridad" className="select" value={form.prioridad} onChange={set('prioridad')}>
                    {PRIORIDAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="fecha_limite">Fecha Límite</label>
                  <input id="fecha_limite" className="input" type="date" value={form.fecha_limite} onChange={set('fecha_limite')} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={form.mostrar_auditoria} 
                      onChange={e => setForm(p => ({ ...p, mostrar_auditoria: e.target.checked }))} 
                      style={{ accentColor: 'var(--brand-500)', width: 16, height: 16 }}
                    />
                    Mostrar en Auditoría
                  </label>
                </div>
              </div>

              {/* Etiquetas */}
              <div className="form-group">
                <label className="form-label">Etiquetas</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {etiquetas.map(et => (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => toggleTag(et.id)}
                      style={{
                        background: form.etiqueta_ids.includes(et.id) ? `${et.color}25` : 'transparent',
                        border: `1px solid ${form.etiqueta_ids.includes(et.id) ? et.color : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <TagBadge etiqueta={et} />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: '#EF4444', fontSize: '0.875rem' }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {isEdit && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                  {!confirmDelete
                    ? <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>🗑 Eliminar</button>
                    : (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>¿Confirmar?</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loading}>
                          {loading ? '...' : 'Sí, eliminar'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                      </div>
                    )
                  }
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '⏳ Guardando...' : isEdit ? '💾 Guardar cambios' : '✓ Crear tarea'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

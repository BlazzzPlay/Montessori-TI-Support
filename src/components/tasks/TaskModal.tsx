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
    mostrar_auditoria: tarea?.mostrar_auditoria ?? true,
    progreso: tarea?.progreso ?? 0,
    mostrar_progreso: tarea?.mostrar_progreso ?? false,
    subtareas: tarea?.subtareas ?? []
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

  const addSubtarea = () => {
    setForm(prev => ({
      ...prev,
      subtareas: [...(prev.subtareas || []), { 
        id: Math.random().toString(36).substr(2, 9), 
        titulo: '', 
        completada: false,
        checklist: []
      }]
    }))
  }

  const updateSubtarea = (id: string, text: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.map(s => s.id === id ? { ...s, titulo: text } : s)
    }))
  }

  const toggleSubtarea = (id: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.map(s => s.id === id ? { ...s, completada: !s.completada } : s)
    }))
  }

  const removeSubtarea = (id: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.filter(s => s.id !== id)
    }))
  }

  const addChecklistItem = (subtareaId: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.map(s => s.id === subtareaId ? {
        ...s,
        checklist: [...(s.checklist || []), { id: Math.random().toString(36).substr(2, 9), texto: '', completada: false }]
      } : s)
    }))
  }

  const updateChecklistItem = (subId: string, itemId: string, text: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.map(s => s.id === subId ? {
        ...s,
        checklist: s.checklist?.map(i => i.id === itemId ? { ...i, texto: text } : i)
      } : s)
    }))
  }

  const toggleChecklistItem = (subId: string, itemId: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.map(s => s.id === subId ? {
        ...s,
        checklist: s.checklist?.map(i => i.id === itemId ? { ...i, completada: !i.completada } : i)
      } : s)
    }))
  }

  const removeChecklistItem = (subId: string, itemId: string) => {
    setForm(prev => ({
      ...prev,
      subtareas: prev.subtareas?.map(s => s.id === subId ? {
        ...s,
        checklist: s.checklist?.filter(i => i.id !== itemId)
      } : s)
    }))
  }

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

              {/* Nuevas: Progreso y Sub-tareas */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Control de Progreso */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                      <input 
                        type="checkbox" 
                        checked={form.mostrar_progreso} 
                        onChange={e => setForm(p => ({ ...p, mostrar_progreso: e.target.checked }))} 
                        style={{ accentColor: 'var(--brand-500)', width: 18, height: 18 }}
                      />
                      Habilitar porcentaje de avance
                    </label>
                    {form.mostrar_progreso && (
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-500)', background: 'var(--brand-50)', padding: '2px 8px', borderRadius: '4px' }}>
                        {form.progreso}%
                      </span>
                    )}
                  </div>
                  
                  {form.mostrar_progreso && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={form.progreso} 
                        onChange={e => setForm(p => ({ ...p, progreso: parseInt(e.target.value) }))}
                        style={{ flex: 1, accentColor: 'var(--brand-500)', height: '6px', borderRadius: '3px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Checklist de Sub-tareas */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Pasos / Check-list de la tarea</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addSubtarea} style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--brand-600)' }}>
                      + Agregar paso
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {form.subtareas?.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--bg-hover)' }}>
                        No hay pasos agregados aún. Comienza agregando uno para organizar mejor el trabajo.
                      </div>
                    ) : (
                      form.subtareas?.map((st) => (
                        <div key={st.id} style={{ 
                          display: 'flex', flexDirection: 'column', gap: '0.5rem', 
                          padding: '0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={st.completada} 
                              onChange={() => toggleSubtarea(st.id)}
                              style={{ accentColor: 'var(--success-500)', width: 18, height: 18, flexShrink: 0 }}
                            />
                            <input 
                              type="text" 
                              className="input" 
                              style={{ 
                                padding: '0.35rem 0.625rem', fontSize: '0.875rem', fontWeight: 600,
                                textDecoration: st.completada ? 'line-through' : 'none',
                                opacity: st.completada ? 0.6 : 1,
                                background: 'transparent', border: 'none'
                              }} 
                              placeholder="Título del paso principal..." 
                              value={st.titulo} 
                              onChange={e => updateSubtarea(st.id, e.target.value)} 
                            />
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addChecklistItem(st.id)} style={{ fontSize: '0.7rem', color: 'var(--brand-500)' }}>+ Item</button>
                            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeSubtarea(st.id)} style={{ padding: '0.25rem' }}>✕</button>
                          </div>

                          {/* Nested Checklist */}
                          {st.checklist && st.checklist.length > 0 && (
                            <div style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.25rem' }}>
                              {st.checklist.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={item.completada} 
                                    onChange={() => toggleChecklistItem(st.id, item.id)}
                                    style={{ accentColor: 'var(--brand-400)', width: 14, height: 14, flexShrink: 0 }}
                                  />
                                  <input 
                                    type="text" 
                                    className="input" 
                                    style={{ 
                                      padding: '2px 6px', fontSize: '0.75rem',
                                      textDecoration: item.completada ? 'line-through' : 'none',
                                      opacity: item.completada ? 0.6 : 1,
                                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)'
                                    }} 
                                    placeholder="Detalle..." 
                                    value={item.texto} 
                                    onChange={e => updateChecklistItem(st.id, item.id, e.target.value)} 
                                  />
                                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeChecklistItem(st.id, item.id)} style={{ width: '18px', height: '18px', padding: 0 }}>✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
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

import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TagBadge, PRIORIDAD_OPTIONS, ESTADO_OPTIONS } from '../ui/Badges'
import { formatDateTime, genId } from '../../lib/utils'
import type { Tarea, Etiqueta, TareaFormData, Comentario } from '../../types'

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

  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('')

  const handleAddComment = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!tarea || !onUpdate || !nuevoComentarioTexto.trim()) return
    setLoading(true)
    // Marcar todos los mensajes de gestión como leídos al responder
    const comentariosActualizados = (tarea.comentarios || []).map(c =>
      !c.es_admin ? { ...c, leido_por_admin: true } : c
    )
    const comment: Comentario = {
      id: genId(),
      tarea_id: tarea.id,
      autor_nombre: 'Soporte Técnico',
      contenido: nuevoComentarioTexto,
      created_at: new Date().toISOString(),
      es_admin: true,          // Respuesta del admin/técnico
      leido_por_admin: true,
    }
    const nuevos = [...comentariosActualizados, comment]
    // Optimistic / rely on upstream state
    await onUpdate(tarea.id, { comentarios: nuevos })
    setNuevoComentarioTexto('')
    setLoading(false)
  }

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

              {/* Comentarios (Solo Edit) — Chat bidireccional */}
              {isEdit && tarea && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    💬 Comentarios de Gestión
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', background: 'var(--brand-500)', borderRadius: '99px', padding: '1px 7px' }}>
                      {tarea.comentarios?.length || 0}
                    </span>
                    {(tarea.comentarios || []).some(c => !c.es_admin && !c.leido_por_admin) && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'white', background: '#ef4444', borderRadius: '99px', padding: '1px 7px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        🔴 {(tarea.comentarios || []).filter(c => !c.es_admin && !c.leido_por_admin).length} nuevos
                      </span>
                    )}
                  </h3>

                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    maxHeight: '260px', overflowY: 'auto',
                    background: 'var(--bg-default)', borderRadius: 'var(--radius-md)',
                    padding: '0.875rem', border: '1px solid var(--border-subtle)'
                  }}>
                    {(tarea.comentarios || []).length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1.5rem 0' }}>Sin mensajes aún.</div>
                    )}
                    {(tarea.comentarios || []).map(c => {
                      const isAdminMsg = c.es_admin
                      return (
                        <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdminMsg ? 'flex-end' : 'flex-start' }}>
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '3px', paddingLeft: isAdminMsg ? 0 : '4px', paddingRight: isAdminMsg ? '4px' : 0 }}>
                            <strong style={{ color: isAdminMsg ? 'var(--brand-500)' : '#10b981' }}>{c.autor_nombre}</strong>
                            {' · '}{formatDateTime(c.created_at)}
                            {!isAdminMsg && !c.leido_por_admin && (
                              <span style={{ marginLeft: '4px', color: '#ef4444', fontWeight: 700 }}>● nuevo</span>
                            )}
                          </div>
                          <div style={{
                            maxWidth: '85%', padding: '0.5rem 0.75rem',
                            borderRadius: isAdminMsg ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                            background: isAdminMsg ? 'var(--brand-500)' : 'var(--bg-surface)',
                            color: isAdminMsg ? 'white' : 'var(--text-primary)',
                            fontSize: '0.8125rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                            border: isAdminMsg ? 'none' : '1px solid var(--border-default)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            {c.contenido}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--brand-500)', fontWeight: 700 }}>🛠 Respondiendo como Soporte Técnico</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <textarea
                        className="input"
                        style={{ flex: 1, minHeight: '52px', resize: 'none', fontSize: '0.8125rem', padding: '0.5rem' }}
                        placeholder="Escribe tu respuesta..."
                        value={nuevoComentarioTexto}
                        onChange={e => setNuevoComentarioTexto(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleAddComment(e as unknown as React.MouseEvent)
                          }
                        }}
                      />
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleAddComment} disabled={loading || !nuevoComentarioTexto.trim()} style={{ alignSelf: 'flex-end', padding: '0.5rem 0.875rem' }}>Enviar</button>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Enter para enviar · Shift+Enter nueva línea</div>
                  </div>
                </div>
              )}

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

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useReservas } from '../hooks/useReservas'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../contexts/ThemeContext'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { CHILE_TZ } from '../lib/utils'
import type { ReservaTablet, TipoSolicitante, EstadoReserva } from '../types'

// ──────────────────────────────────────────────────
// CONSTANTES DE HORARIOS
// ──────────────────────────────────────────────────
const BLOQUES_MANANA = [
  { id: 'm1', label: '1°', inicio: '08:00', fin: '08:45' },
  { id: 'm2', label: '2°', inicio: '08:45', fin: '09:30' },
  { id: 'm3', label: '3°', inicio: '09:45', fin: '10:30' },
  { id: 'm4', label: '4°', inicio: '10:30', fin: '11:15' },
  { id: 'm5', label: '5°', inicio: '11:25', fin: '12:10' },
  { id: 'm6', label: '6°', inicio: '12:10', fin: '12:55' },
  { id: 'm7', label: '7°', inicio: '12:55', fin: '13:30' },
  { id: 'm8', label: '8°', inicio: '13:30', fin: '14:15' },
]

const BLOQUES_TARDE = [
  { id: 't1', label: '1°', inicio: '14:00', fin: '14:45' },
  { id: 't2', label: '2°', inicio: '14:45', fin: '15:30' },
  { id: 't3', label: '3°', inicio: '15:45', fin: '16:30' },
  { id: 't4', label: '4°', inicio: '16:30', fin: '17:15' },
  { id: 't5', label: '5°', inicio: '17:25', fin: '18:10' },
  { id: 't6', label: '6°', inicio: '18:10', fin: '18:55' },
]

export function ReservaTabletsPage() {
  const { reservas, loading, createReserva, updateReserva, deleteReserva } = useReservas()
  const { addToast } = useToast()
  const { settings } = useSettings()
  
  const [modalType, setModalType] = useState<'prestamo' | 'reserva' | null>(null)
  const [editingReserva, setEditingReserva] = useState<ReservaTablet | null>(null)
  
  // Stats
  const prestadasCount = reservas.filter(r => r.estado === 'en_prestamo').reduce((acc, r) => acc + r.cantidad, 0)
  const reservasHoy = reservas.filter(r => r.estado === 'reservado').length
  
  const handleSave = async (fields: any) => {
    // Convertir fechas ingenuas (naive) a UTC real usando la zona de Chile
    const preparedFields = {
      ...fields,
      fecha_inicio: fromZonedTime(fields.fecha_inicio, CHILE_TZ).toISOString(),
      fecha_fin: fromZonedTime(fields.fecha_fin, CHILE_TZ).toISOString()
    }

    if (editingReserva) {
      const res = await updateReserva(editingReserva.id, preparedFields)
      if (res.error) addToast(res.error, 'error')
      else {
        addToast('✓ Cambios guardados', 'success')
        setEditingReserva(null)
      }
    } else {
      const res = await createReserva(preparedFields)
      if (res.error) addToast(res.error, 'error')
      else {
        addToast(modalType === 'prestamo' ? '✓ Préstamo registrado' : '✓ Reserva creada', 'success')
        setModalType(null)
      }
    }
  }

  const handleUpdateStatus = async (id: string, nuevoEstado: EstadoReserva) => {
    const updates: Partial<ReservaTablet> = { estado: nuevoEstado }
    if (nuevoEstado === 'en_prestamo') updates.fecha_entrega = new Date().toISOString()
    if (nuevoEstado === 'devuelto') updates.fecha_devolucion = new Date().toISOString()
    
    const res = await updateReserva(id, updates)
    if (res.error) addToast(res.error, 'error')
    else addToast(`Estado actualizado: ${nuevoEstado}`, 'success')
  }

  return (
    <AppLayout tareas={[]} onNewTask={() => { setModalType('prestamo') }}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reserva de Tablets</h1>
            <p className="page-subtitle">Gestión de préstamos para alumnos y profesores</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => { setModalType('reserva') }}>
              📅 Nueva Reserva
            </button>
            <button className="btn btn-primary" onClick={() => { setModalType('prestamo') }}>
              🚀 Registrar Préstamo
            </button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--brand-500)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * Math.max(0, settings.totalTablets - prestadasCount)) / (settings.totalTablets || 1)} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{Math.max(0, settings.totalTablets - prestadasCount)}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>/{settings.totalTablets}</span>
              </div>
            </div>
            <div>
              <div className="kpi-label">Disponibilidad de Tablets</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{Math.max(0, settings.totalTablets - prestadasCount)} Libres</div>
              <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>{prestadasCount} en préstamo actual</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pendientes Hoy</div>
            <div className="kpi-valueText" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{reservasHoy}</div>
            <div className="kpi-trend">Reservas por entregar</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Listado de Reservas</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando registros...</div>
            ) : reservas.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>No hay reservas registradas</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Las nuevas solicitudes aparecerán aquí.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Solicitante</th>
                    <th>Cant.</th>
                    <th>Curso</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map(reserva => (
                    <tr 
                      key={reserva.id} 
                      onClick={() => setEditingReserva(reserva)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700 }}>{reserva.solicitante_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{reserva.solicitante_tipo}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{reserva.cantidad}</div>
                      </td>
                      <td>{reserva.curso || '—'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {formatInTimeZone(new Date(reserva.fecha_inicio), CHILE_TZ, "d MMM, HH:mm")}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {formatInTimeZone(new Date(reserva.fecha_fin), CHILE_TZ, "d MMM, HH:mm")}
                      </td>
                      <td>
                        <span className={`badge`} style={{ 
                          background: reserva.estado === 'en_prestamo' ? 'var(--priority-alta)15' : 
                                     reserva.estado === 'devuelto' ? 'var(--priority-baja)15' : 
                                     reserva.estado === 'reservado' ? 'var(--brand-500)15' : 'var(--bg-raised)',
                          color: reserva.estado === 'en_prestamo' ? 'var(--priority-alta)' : 
                                 reserva.estado === 'devuelto' ? 'var(--priority-baja)' : 
                                 reserva.estado === 'reservado' ? 'var(--brand-500)' : 'var(--text-muted)'
                        }}>
                          {reserva.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {reserva.estado === 'reservado' && (
                            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(reserva.id, 'en_prestamo') }}>Entregar</button>
                          )}
                          {reserva.estado === 'en_prestamo' && (
                            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(reserva.id, 'devuelto') }}>Devolver</button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setEditingReserva(reserva) }} title="Editar">✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={(e) => { e.stopPropagation(); if(window.confirm('¿Eliminar?')) deleteReserva(reserva.id) }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(modalType || editingReserva) && (
          <ReservaModal 
            type={modalType || (editingReserva?.estado === 'en_prestamo' ? 'prestamo' : 'reserva')}
            reserva={editingReserva || undefined}
            onClose={() => { setModalType(null); setEditingReserva(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

function ReservaModal({ type, reserva, onClose, onSave }: { type: 'prestamo' | 'reserva', reserva?: ReservaTablet, onClose: () => void, onSave: (f: any) => void }) {
  const [form, setForm] = useState({
    solicitante_nombre: reserva?.solicitante_nombre ?? '',
    solicitante_tipo: (reserva?.solicitante_tipo ?? 'profesor') as TipoSolicitante,
    cantidad: reserva?.cantidad ?? 1,
    curso: reserva?.curso ?? '',
    fecha_inicio: reserva ? formatInTimeZone(new Date(reserva.fecha_inicio), CHILE_TZ, "yyyy-MM-dd'T'HH:mm") : formatInTimeZone(new Date(), CHILE_TZ, "yyyy-MM-dd'T'HH:mm"),
    fecha_fin: reserva ? formatInTimeZone(new Date(reserva.fecha_fin), CHILE_TZ, "yyyy-MM-dd'T'HH:mm") : formatInTimeZone(new Date(Date.now() + 3600000 * 2), CHILE_TZ, "yyyy-MM-dd'T'HH:mm"),
    notas: reserva?.notas ?? '',
    estado: reserva?.estado ?? (type === 'prestamo' ? 'en_prestamo' : 'reservado')
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {reserva ? '✏️ Editar Registro' : (type === 'prestamo' ? '🚀 Registrar Préstamo' : '📅 Nueva Reserva')}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Selector de Bloques (Pre-configurados) */}
          {type === 'prestamo' && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', color: 'var(--brand-500)', fontWeight: 700 }}>🕒 Hora de Inicio</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                    {BLOQUES_MANANA.map(b => (
                      <button 
                        key={`start-m-${b.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ 
                          fontSize: '0.7rem', padding: '0.4rem', fontWeight: 800, 
                          background: form.fecha_inicio.endsWith(b.inicio) ? 'var(--brand-500)' : 'var(--bg-raised)', 
                          color: form.fecha_inicio.endsWith(b.inicio) ? 'white' : 'inherit',
                          border: '1px solid var(--border-subtle)' 
                        }}
                        onClick={() => {
                          const today = formatInTimeZone(new Date(), CHILE_TZ, "yyyy-MM-dd")
                          setForm({ ...form, fecha_inicio: `${today}T${b.inicio}` })
                        }}
                      >
                        {b.inicio}
                      </button>
                    ))}
                    {BLOQUES_TARDE.map(b => (
                      <button 
                        key={`start-t-${b.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ 
                          fontSize: '0.7rem', padding: '0.4rem', fontWeight: 800, 
                          background: form.fecha_inicio.endsWith(b.inicio) ? 'var(--brand-500)' : 'var(--bg-raised)', 
                          color: form.fecha_inicio.endsWith(b.inicio) ? 'white' : 'inherit',
                          border: '1px solid var(--border-subtle)' 
                        }}
                        onClick={() => {
                          const today = formatInTimeZone(new Date(), CHILE_TZ, "yyyy-MM-dd")
                          setForm({ ...form, fecha_inicio: `${today}T${b.inicio}` })
                        }}
                      >
                        {b.inicio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', color: 'var(--priority-alta)', fontWeight: 700 }}>🏁 Hora de Término</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                    {[...BLOQUES_MANANA].map(b => (
                      <button 
                        key={`end-m-${b.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ 
                          fontSize: '0.7rem', padding: '0.4rem', fontWeight: 800, 
                          background: form.fecha_fin.endsWith(b.fin) ? 'var(--priority-alta)' : 'var(--bg-raised)', 
                          color: form.fecha_fin.endsWith(b.fin) ? 'white' : 'inherit',
                          border: '1px solid var(--border-subtle)' 
                        }}
                        onClick={() => {
                          const today = formatInTimeZone(new Date(), CHILE_TZ, "yyyy-MM-dd")
                          setForm({ ...form, fecha_fin: `${today}T${b.fin}` })
                        }}
                      >
                        {b.fin}
                      </button>
                    ))}
                    {[...BLOQUES_TARDE].map(b => (
                      <button 
                        key={`end-t-${b.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ 
                          fontSize: '0.7rem', padding: '0.4rem', fontWeight: 800, 
                          background: form.fecha_fin.endsWith(b.fin) ? 'var(--priority-alta)' : 'var(--bg-raised)', 
                          color: form.fecha_fin.endsWith(b.fin) ? 'white' : 'inherit',
                          border: '1px solid var(--border-subtle)' 
                        }}
                        onClick={() => {
                          const today = formatInTimeZone(new Date(), CHILE_TZ, "yyyy-MM-dd")
                          setForm({ ...form, fecha_fin: `${today}T${b.fin}` })
                        }}
                      >
                        {b.fin}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label required">Nombre del Solicitante</label>
              <input type="text" className="input" placeholder="Ej: Juan Pérez / Prof. García" value={form.solicitante_nombre} onChange={e => setForm({...form, solicitante_nombre: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="select" value={form.solicitante_tipo} onChange={e => setForm({...form, solicitante_tipo: e.target.value as TipoSolicitante})}>
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input type="number" className="input" value={form.cantidad} onChange={e => setForm({...form, cantidad: parseInt(e.target.value) || 1})} min={1} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Curso</label>
            <input type="text" className="input" placeholder="Ej: 8° Básico A" value={form.curso} onChange={e => setForm({...form, curso: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label required">
                {type === 'prestamo' ? 'Hora Inicio' : 'Inicio Préstamo'}
              </label>
              <input 
                type={type === 'prestamo' ? "time" : "datetime-local"} 
                className="input" 
                value={type === 'prestamo' ? form.fecha_inicio.split('T')[1] : form.fecha_inicio} 
                onChange={e => {
                  if (type === 'prestamo') {
                    const today = form.fecha_inicio.split('T')[0]
                    setForm({...form, fecha_inicio: `${today}T${e.target.value}`})
                  } else {
                    setForm({...form, fecha_inicio: e.target.value})
                  }
                }} 
              />
            </div>
            <div className="form-group">
              <label className="form-label required">
                {type === 'prestamo' ? 'Hora Término' : 'Término Préstamo'}
              </label>
              <input 
                type={type === 'prestamo' ? "time" : "datetime-local"} 
                className="input" 
                value={type === 'prestamo' ? form.fecha_fin.split('T')[1] : form.fecha_fin} 
                onChange={e => {
                  if (type === 'prestamo') {
                    const today = form.fecha_fin.split('T')[0]
                    setForm({...form, fecha_fin: `${today}T${e.target.value}`})
                  } else {
                    setForm({...form, fecha_fin: e.target.value})
                  }
                }} 
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Notas</label>
            <textarea className="textarea" rows={2} value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Opcional..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            {reserva ? 'Guardar Cambios' : (type === 'prestamo' ? 'Registrar Préstamo' : 'Confirmar Reserva')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

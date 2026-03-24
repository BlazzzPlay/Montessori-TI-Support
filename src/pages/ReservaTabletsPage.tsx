import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useReservas } from '../hooks/useReservas'
import { useToast } from '../contexts/ThemeContext'
import type { ReservaTablet, TipoSolicitante, EstadoReserva } from '../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function ReservaTabletsPage() {
  const { reservas, loading, createReserva, updateReserva, deleteReserva } = useReservas()
  const { addToast } = useToast()
  
  const [modalOpen, setModalOpen] = useState(false)
  
  // Stats
  const prestadasCount = reservas.filter(r => r.estado === 'en_prestamo').reduce((acc, r) => acc + r.cantidad, 0)
  const reservasHoy = reservas.filter(r => r.estado === 'reservado').length
  
  const handleCreate = async (fields: any) => {
    const res = await createReserva(fields)
    if (res.error) addToast(res.error, 'error')
    else {
      addToast('✓ Reserva creada exitosamente', 'success')
      setModalOpen(false)
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
    <AppLayout tareas={[]} onNewTask={() => { setModalOpen(true) }}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reserva de Tablets</h1>
            <p className="page-subtitle">Gestión de préstamos para alumnos y profesores</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setModalOpen(true) }}>
            + Registrar Préstamo
          </button>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Tablets Fuera</div>
            <div className="kpi-value" style={{ color: 'var(--brand-500)' }}>{prestadasCount}</div>
            <div className="kpi-trend">En uso actualmente</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pendientes Hoy</div>
            <div className="kpi-valueText" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{reservasHoy}</div>
            <div className="kpi-trend">Reservas por entregar</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Capacidad Total</div>
            <div className="kpi-valueText" style={{ fontSize: '1.75rem', fontWeight: 800 }}>30</div>
            <div className="kpi-trend">Stock teórico dpto.</div>
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
                    <tr key={reserva.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{reserva.solicitante_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{reserva.solicitante_tipo}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{reserva.cantidad}</div>
                      </td>
                      <td>{reserva.curso || '—'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {format(new Date(reserva.fecha_inicio), "d MMM, HH:mm", { locale: es })}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {format(new Date(reserva.fecha_fin), "d MMM, HH:mm", { locale: es })}
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
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(reserva.id, 'en_prestamo')}>Entregar</button>
                          )}
                          {reserva.estado === 'en_prestamo' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(reserva.id, 'devuelto')}>Devolver</button>
                          )}
                          <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => { if(window.confirm('¿Eliminar?')) deleteReserva(reserva.id) }}>🗑</button>
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
        {modalOpen && (
          <ReservaModal 
            onClose={() => setModalOpen(false)}
            onSave={handleCreate}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

function ReservaModal({ onClose, onSave }: { onClose: () => void, onSave: (f: any) => void }) {
  const [form, setForm] = useState({
    solicitante_nombre: '',
    solicitante_tipo: 'profesor' as TipoSolicitante,
    cantidad: 1,
    curso: '',
    fecha_inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    fecha_fin: format(new Date(Date.now() + 3600000 * 2), "yyyy-MM-dd'T'HH:mm"),
    notas: ''
  })

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">📋 Nueva Reserva de Tablets</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
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
              <label className="form-label required">Inicio Préstamo</label>
              <input type="datetime-local" className="input" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label required">Término Préstamo</label>
              <input type="datetime-local" className="input" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Notas</label>
            <textarea className="textarea" rows={2} value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Opcional..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Confirmar Reserva</button>
        </div>
      </motion.div>
    </div>
  )
}

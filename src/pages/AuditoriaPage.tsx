import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useTareas } from '../hooks/useTareas'
import { useHelpCounters } from '../hooks/useHelpCounters'
import { formatDate, formatDateTime, STATUS_LABELS } from '../lib/utils'
import type { Tarea } from '../types'

// ──────────────────────────────────────────────────
// Helpers para derivar estadísticas desde tareas reales
// ──────────────────────────────────────────────────

function calcStats(tareas: Tarea[]) {
  const resueltas = tareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado')

  // % cambio vs semana anterior (resueltas esta semana vs anterior)
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
  const prevWeekStart = new Date(now); prevWeekStart.setDate(now.getDate() - 14)
  const estaSeamna = resueltas.filter(t => new Date(t.updated_at) >= weekStart).length
  const semanaAnterior = resueltas.filter(t => {
    const d = new Date(t.updated_at)
    return d >= prevWeekStart && d < weekStart
  }).length
  const pct = semanaAnterior > 0 ? Math.round(((estaSeamna - semanaAnterior) / semanaAnterior) * 100) : 0

  return { totalResueltas: resueltas.length, pct, estaSeamna }
}

function calcEtiquetaStats(tareas: Tarea[]) {
  const map = new Map<string, { nombre: string; color: string; total: number }>()
  tareas.forEach(t => {
    t.etiquetas?.forEach(e => {
      const prev = map.get(e.id) ?? { nombre: e.nombre, color: e.color, total: 0 }
      map.set(e.id, { ...prev, total: prev.total + 1 })
    })
  })
  return [...map.values()].sort((a, b) => b.total - a.total)
}

function calcVolume(tareas: Tarea[]) {
  // Últimos 6 meses agrupados por mes
  const months: Record<string, { total: number; resueltas: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    months[key] = { total: 0, resueltas: 0 }
  }
  tareas.forEach(t => {
    const d = new Date(t.created_at)
    if (d < new Date(now.getFullYear(), now.getMonth() - 5, 1)) return
    const key = d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    if (!months[key]) return
    months[key].total++
    if (t.estado === 'resuelto' || t.estado === 'cerrado') months[key].resueltas++
  })
  return Object.entries(months).map(([mes, v]) => ({ mes, ...v }))
}

// ──────────────────────────────────────────────────
// Componentes auxiliares
// ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
      {label && <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}:</span><strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.07) return null
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RenderTable({ lista, emptyIcon, emptyTitle, emptyDesc, totalTareas, onRowClick }: { lista: Tarea[], emptyIcon: string, emptyTitle: string, emptyDesc: string, totalTareas: number, onRowClick?: (t: Tarea) => void }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Solicitante</th>
              <th>Ubicación</th>
              <th>Creada</th>
              <th>Actualizada</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((t: Tarea) => {
              return (
                <tr key={t.id} onClick={onRowClick ? () => onRowClick(t) : undefined} style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.2s' }} className={onRowClick ? 'hoverable-row' : ''}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.titulo}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
                      {t.etiquetas?.map(e => (
                        <span key={e.id} style={{ fontSize: '0.625rem', padding: '1px 6px', borderRadius: 99, background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}35`, fontWeight: 600 }}>
                          {e.nombre}
                        </span>
                      ))}
                      {(t.comentarios?.length || 0) > 0 && (
                        <span style={{ fontSize: '0.625rem', padding: '1px 6px', borderRadius: 99, background: `rgba(99, 102, 241, 0.1)`, color: '#6366f1', border: `1px solid rgba(99, 102, 241, 0.3)`, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                           💬 {t.comentarios?.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td><span className={`priority-badge priority-${t.prioridad}`}>{t.prioridad}</span></td>
                  <td><span className={`status-badge status-${t.estado}`}>{STATUS_LABELS[t.estado]}</span></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t.solicitante}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.ubicacion ?? '—'}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--priority-baja)', whiteSpace: 'nowrap' }}>
                    {t.resuelto_at ? formatDateTime(t.resuelto_at) : formatDate(t.updated_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {lista.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">{emptyIcon}</div>
            <div className="empty-state-title">{emptyTitle}</div>
            <div className="empty-state-desc">
              {totalTareas === 0
                ? 'Aún no hay tareas en el sistema.'
                : emptyDesc}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────

export function AuditoriaPage() {
  const { tareas, loading } = useTareas()
  const { helpCounters } = useHelpCounters()
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tabResueltas, setTabResueltas] = useState<'mes' | 'anio'>('mes')
  const [showModal, setShowModal] = useState(false)
  const [selectedTareaId, setSelectedTareaId] = useState<string | undefined>()
  const selectedTarea = useMemo(() => tareas.find(t => t.id === selectedTareaId), [tareas, selectedTareaId])

  // Filtrar tareas que no deban mostrarse (a menos que ya estén completadas)
  const visibleTareas = useMemo(() => {
    return tareas.filter(t => t.mostrar_auditoria !== false || t.estado === 'resuelto' || t.estado === 'cerrado')
  }, [tareas])

  // Tareas filtradas por rango de fecha
  const tareasFiltradas = useMemo(() => {
    let res = visibleTareas;
    if (dateFrom) res = res.filter(t => new Date(t.resuelto_at ?? t.updated_at) >= new Date(dateFrom))
    if (dateTo)   res = res.filter(t => new Date(t.resuelto_at ?? t.updated_at) <= new Date(dateTo + 'T23:59:59'))
    return res.sort((a, b) => new Date(b.resuelto_at ?? b.updated_at).getTime() - new Date(a.resuelto_at ?? a.updated_at).getTime())
  }, [visibleTareas, dateFrom, dateTo])

  const tareasPendientes = useMemo(() => visibleTareas.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso'), [visibleTareas])
  const tareasResueltas = useMemo(() => tareasFiltradas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado'), [tareasFiltradas])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const tareasResueltasMes = useMemo(() => tareasResueltas.filter(t => {
      const d = new Date(t.resuelto_at ?? t.updated_at)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }), [tareasResueltas, currentMonth, currentYear])

  const tareasResueltasAnio = useMemo(() => tareasResueltas.filter(t => {
      const d = new Date(t.resuelto_at ?? t.updated_at)
      return d.getFullYear() === currentYear
  }), [tareasResueltas, currentYear])

  // Stats y gráficos calculados desde datos reales (todas las tareas visibles, no solo el filtro)
  const stats        = useMemo(() => calcStats(visibleTareas), [visibleTareas])
  const etiquetaStats = useMemo(() => calcEtiquetaStats(visibleTareas), [visibleTareas])
  const volumeData   = useMemo(() => calcVolume(visibleTareas), [visibleTareas])

  const handleExport = () => {
    const headers = ['ID', 'Título', 'Solicitante', 'Ubicación', 'Prioridad', 'Estado', 'Creada', 'Resuelta']
    const rows = tareasFiltradas.map(t => [
      t.id, t.titulo, t.solicitante, t.ubicacion ?? '', t.prioridad, t.estado,
      new Date(t.created_at).toLocaleString('es-CL'),
      t.resuelto_at ? new Date(t.resuelto_at).toLocaleString('es-CL') : new Date(t.updated_at).toLocaleString('es-CL')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'auditoria-ti.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-default)', overflowX: 'hidden' }}>
      <main style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div className="page-container">
          <div className="kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton kpi-card" style={{ height: 100 }} />)}
          </div>
          <div className="charts-grid">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton chart-card" style={{ height: 280 }} />)}
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-default)', overflowX: 'hidden' }}>
      <main style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div className="page-container">
          {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard de Auditoría</h1>
            <p className="page-subtitle">
              <span style={{ fontSize: '0.625rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontWeight: 700, marginRight: '0.5rem', border: '1px solid rgba(34,197,94,0.3)' }}>PÚBLICO</span>
              Estadísticas calculadas en tiempo real · {visibleTareas.length} tareas procesadas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => window.open('/solicitud', '_blank')} id="new-task-btn">
              + Nueva Tarea
            </button>
            <button className="btn btn-secondary" onClick={handleExport} id="export-btn">
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* KPIs Minimalistas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ 
            display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem', 
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem'
          }}
        >
          {/* Total Resueltas (Año/Mes) */}
          <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', paddingRight: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Resueltas</div>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', marginBottom: '0.25rem' }}>
              <div>
                 <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-500)', lineHeight: '1' }}>{tareasResueltasAnio.length}</span>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px', textTransform: 'uppercase' }}>año</span>
              </div>
              <div>
                 <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-500)', lineHeight: '1' }}>{tareasResueltasMes.length}</span>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px', textTransform: 'uppercase' }}>mes</span>
              </div>
            </div>
            <div className={`kpi-trend ${stats.pct >= 0 ? 'trend-up' : 'trend-down'}`} style={{ marginTop: 'auto' }}>
              {stats.pct >= 0 ? '↑' : '↓'} {Math.abs(stats.pct)}% vs sem. ant.
            </div>
          </div>

          {/* Activas Ahora */}
          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', paddingRight: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Activas Ahora</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--priority-urgente)', lineHeight: '1', marginBottom: '0.25rem' }}>
              {visibleTareas.filter(t => t.estado !== 'cerrado' && t.estado !== 'resuelto').length}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--priority-urgente)' }}>🔴</span> {visibleTareas.filter(t => t.prioridad === 'urgente' && t.estado === 'pendiente').length} urgentes pend.
            </div>
          </div>

          {/* Tareas Rápidas (Compactas) */}
          <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚡</span> Tareas Rápidas (Mensual)
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: 'auto' }}>
              {[
                { key: 'apoderados', label: 'Apoderados', color: '#3B82F6', icon: '👨‍👩‍👧‍👦' },
                { key: 'alumnos', label: 'Alumnos', color: '#10B981', icon: '🎓' },
                { key: 'profesores', label: 'Profesores', color: '#F59E0B', icon: '👨‍🏫' },
                { key: 'administrativos', label: 'Admin', color: '#6366F1', icon: '🏢' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', background: `${item.color}10`, border: `1px solid ${item.color}30`, borderRadius: '99px' }}>
                  <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>{helpCounters[item.key as keyof typeof helpCounters]}</span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tareas Pendientes (Movidas arriba para mayor visibilidad) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏳ Tareas Pendientes <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-muted)' }}>({tareasPendientes.length})</span>
          </h2>
          <RenderTable 
            lista={tareasPendientes} 
            totalTareas={tareas.length}
            emptyIcon="⏳"
            emptyTitle="No hay tareas pendientes"
            emptyDesc="No se encontraron tareas en proceso."
            onRowClick={t => { setSelectedTareaId(t.id); setShowModal(true) }}
          />
        </motion.div>

        {/* Gráficos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="charts-grid" style={{ marginBottom: '2rem' }}>

          {/* Pie — por etiqueta */}
          <div className="chart-card">
            <div className="chart-title">📊 Tickets por Etiqueta</div>
            {etiquetaStats.length === 0 ? (
              <div className="empty-state" style={{ height: 240 }}>
                <div className="empty-state-icon">🏷️</div>
                <div className="empty-state-desc">Sin datos suficientes aún</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={etiquetaStats} cx="50%" cy="50%" outerRadius={110} dataKey="total" labelLine={false} label={PieLabel} nameKey="nombre">
                    {etiquetaStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Barras — volumen mensual */}
          <div className="chart-card">
            <div className="chart-title">📅 Volumen de Incidencias por Mes</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={volumeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v === 'total' ? 'Total' : 'Resueltas'}</span>} />
                <Bar dataKey="total" name="total" fill="rgba(59,130,246,0.4)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resueltas" name="resueltas" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tabla de historial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                🗒 Historial de Resoluciones
              </h2>
              <div className="tabs">
                <button className={`tab ${tabResueltas === 'mes' ? 'active' : ''}`} onClick={() => setTabResueltas('mes')}>📆 Mes en curso ({tareasResueltasMes.length})</button>
                <button className={`tab ${tabResueltas === 'anio' ? 'active' : ''}`} onClick={() => setTabResueltas('anio')}>📅 Año en curso ({tareasResueltasAnio.length})</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Desde:</label>
              <input type="date" className="input" style={{ width: 'auto', padding: '0.35rem 0.625rem', fontSize: '0.8125rem' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Hasta:</label>
              <input type="date" className="input" style={{ width: 'auto', padding: '0.35rem 0.625rem', fontSize: '0.8125rem' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
              {(dateFrom || dateTo) && <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo('') }}>✕ Limpiar</button>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {tabResueltas === 'mes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <RenderTable 
                  lista={tareasResueltasMes} 
                  totalTareas={tareas.length}
                  emptyIcon="📆"
                  emptyTitle="No hay tareas resueltas este mes"
                  emptyDesc="Ajusta el rango de fechas o espera a que se resuelvan tareas."
                  onRowClick={t => { setSelectedTareaId(t.id); setShowModal(true) }}
                />
              </motion.div>
            )}

            {tabResueltas === 'anio' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <RenderTable 
                  lista={tareasResueltasAnio} 
                  totalTareas={tareas.length}
                  emptyIcon="📅"
                  emptyTitle="No hay tareas resueltas este año"
                  emptyDesc="Ajusta el rango de fechas o espera a que se resuelvan tareas."
                  onRowClick={t => { setSelectedTareaId(t.id); setShowModal(true) }}
                />
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
      </main>

      {/* Modal de Solo Lectura */}
      {showModal && selectedTarea && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Detalles de Tarea</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Título</label>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedTarea.titulo}</div>
              </div>
              {selectedTarea.descripcion && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</label>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', background: 'var(--bg-default)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>{selectedTarea.descripcion}</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Solicitante</label>
                  <div style={{ fontSize: '0.875rem' }}>{selectedTarea.solicitante}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ubicación</label>
                  <div style={{ fontSize: '0.875rem' }}>{selectedTarea.ubicacion || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prioridad</label>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className={`priority-badge priority-${selectedTarea.prioridad}`}>{selectedTarea.prioridad}</span></div>
                </div>
                {selectedTarea.fecha_limite && (
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha Límite</label>
                    <div style={{ fontSize: '0.875rem' }}>{formatDate(selectedTarea.fecha_limite)}</div>
                  </div>
                )}
              </div>
              {selectedTarea.mostrar_progreso && selectedTarea.progreso !== undefined && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Porcentaje de Avance</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--bg-default)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${selectedTarea.progreso}%`, background: 'var(--brand-500)', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-500)' }}>{selectedTarea.progreso}%</span>
                  </div>
                </div>
              )}
              {selectedTarea.subtareas && selectedTarea.subtareas.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Pasos / Check-list</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-default)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {selectedTarea.subtareas.map((sub: any) => (
                      <div key={sub.id}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <div style={{ color: sub.completada ? 'var(--brand-500)' : 'var(--text-muted)' }}>{sub.completada ? '☑' : '☐'}</div>
                          <div style={{ fontSize: '0.875rem', color: sub.completada ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: sub.completada ? 'line-through' : 'none', fontWeight: 600 }}>{sub.titulo}</div>
                        </div>
                        {sub.checklist && sub.checklist.length > 0 && (
                          <div style={{ marginLeft: '1.5rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {sub.checklist.map((chk: any) => (
                              <div key={chk.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <div style={{ color: chk.completada ? 'var(--brand-500)' : 'var(--text-muted)', fontSize: '0.75rem' }}>{chk.completada ? '✓' : '-'}</div>
                                <div style={{ fontSize: '0.8125rem', color: chk.completada ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: chk.completada ? 'line-through' : 'none' }}>{chk.texto}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

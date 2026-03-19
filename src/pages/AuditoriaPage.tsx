import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import { useTareas } from '../hooks/useTareas'
import { formatDate, formatDateTime, getHoursElapsed } from '../lib/utils'
import type { Tarea } from '../types'

// ──────────────────────────────────────────────────
// Helpers para derivar estadísticas desde tareas reales
// ──────────────────────────────────────────────────

function calcStats(tareas: Tarea[]) {
  const resueltas = tareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado')

  // Tiempo promedio de resolución en horas
  const tiempos = resueltas
    .map(t => {
      const fin = t.resuelto_at ?? t.updated_at
      const diff = new Date(fin).getTime() - new Date(t.created_at).getTime()
      return diff / 3600000 // ms → horas
    })
    .filter(h => h > 0)

  const tiempoPromedio = tiempos.length
    ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length * 10) / 10
    : 0

  const masRapido = tiempos.length ? Math.round(Math.min(...tiempos) * 10) / 10 : 0

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

  return { totalResueltas: resueltas.length, tiempoPromedio, masRapido, pct, estaSeamna }
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

function calcResolucionSemanal(tareas: Tarea[]) {
  // Últimas 6 semanas agrupando por semana calendario
  const resueltas = tareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado')
  const weeks: Record<string, number[]> = {}
  resueltas.forEach(t => {
    const d = new Date(t.resuelto_at ?? t.updated_at)
    const weekNum = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 3600 * 1000))
    if (weekNum > 5) return
    const label = weekNum === 0 ? 'Esta sem.' : `Hace ${weekNum}s`
    if (!weeks[label]) weeks[label] = []
    const h = (d.getTime() - new Date(t.created_at).getTime()) / 3600000
    if (h > 0) weeks[label].push(h)
  })
  return Object.entries(weeks)
    .reverse()
    .map(([semana, horas]) => ({
      semana,
      promedio: horas.length ? Math.round(horas.reduce((a, b) => a + b, 0) / horas.length * 10) / 10 : 0
    }))
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

// ──────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────

export function AuditoriaPage() {
  const { tareas, loading } = useTareas()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Filtrar tareas que no deban mostrarse (a menos que ya estén completadas)
  const visibleTareas = useMemo(() => {
    return tareas.filter(t => t.mostrar_auditoria !== false || t.estado === 'resuelto' || t.estado === 'cerrado')
  }, [tareas])

  // Tareas resueltas filtradas por rango de fecha
  const resueltas = useMemo(() => {
    let res = visibleTareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado')
    if (dateFrom) res = res.filter(t => new Date(t.resuelto_at ?? t.updated_at) >= new Date(dateFrom))
    if (dateTo)   res = res.filter(t => new Date(t.resuelto_at ?? t.updated_at) <= new Date(dateTo + 'T23:59:59'))
    return res.sort((a, b) => new Date(b.resuelto_at ?? b.updated_at).getTime() - new Date(a.resuelto_at ?? a.updated_at).getTime())
  }, [visibleTareas, dateFrom, dateTo])

  // Stats y gráficos calculados desde datos reales (todas las tareas visibles, no solo el filtro)
  const stats        = useMemo(() => calcStats(visibleTareas), [visibleTareas])
  const etiquetaStats = useMemo(() => calcEtiquetaStats(visibleTareas), [visibleTareas])
  const volumeData   = useMemo(() => calcVolume(visibleTareas), [visibleTareas])
  const resolucionData = useMemo(() => calcResolucionSemanal(visibleTareas), [visibleTareas])

  const handleExport = () => {
    const headers = ['ID', 'Título', 'Solicitante', 'Ubicación', 'Prioridad', 'Estado', 'Creada', 'Resuelta', 'Horas']
    const rows = resueltas.map(t => [
      t.id, t.titulo, t.solicitante, t.ubicacion ?? '', t.prioridad, t.estado,
      new Date(t.created_at).toLocaleString('es-CL'),
      t.resuelto_at ? new Date(t.resuelto_at).toLocaleString('es-CL') : new Date(t.updated_at).toLocaleString('es-CL'),
      getHoursElapsed(t.created_at, t.resuelto_at)
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
          <button className="btn btn-secondary" onClick={handleExport} id="export-btn">
            📥 Exportar CSV
          </button>
        </div>

        {/* KPIs — todos calculados desde datos reales */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: 'var(--brand-500)' }}>{stats.totalResueltas}</div>
            <div className="kpi-label">Total resueltas</div>
            <div className={`kpi-trend ${stats.pct >= 0 ? 'trend-up' : 'trend-down'}`}>
              {stats.pct >= 0 ? '↑' : '↓'} {Math.abs(stats.pct)}% vs semana anterior
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: 'var(--priority-media)' }}>
              {stats.tiempoPromedio > 0 ? `${stats.tiempoPromedio}h` : '—'}
            </div>
            <div className="kpi-label">Tiempo promedio</div>
            <div className="kpi-trend">⏱ Por ticket resuelto</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: 'var(--priority-baja)' }}>
              {stats.masRapido > 0 ? `${stats.masRapido}h` : '—'}
            </div>
            <div className="kpi-label">Más rápido resuelto</div>
            <div className="kpi-trend">🏆 Mejor tiempo</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: 'var(--priority-urgente)' }}>
              {visibleTareas.filter(t => t.estado !== 'cerrado' && t.estado !== 'resuelto').length}
            </div>
            <div className="kpi-label">Activas ahora</div>
            <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
              {visibleTareas.filter(t => t.prioridad === 'urgente' && t.estado === 'pendiente').length} urgentes pendientes
            </div>
          </div>
        </motion.div>

        {/* Gráficos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="charts-grid" style={{ marginBottom: '1.5rem' }}>

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

          {/* Línea — tiempo de resolución semanal */}
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">⏱ Tiempo Promedio de Resolución por Semana (horas)</div>
            {resolucionData.length < 2 ? (
              <div className="empty-state" style={{ height: 180 }}>
                <div className="empty-state-icon">📈</div>
                <div className="empty-state-desc">Se necesitan más tickets resueltos para mostrar la tendencia</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={resolucionData} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="semana" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="promedio" name="Horas" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Tabla de historial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
              🗒 Historial de Tareas Resueltas
              <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({resueltas.length})</span>
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Desde:</label>
              <input type="date" className="input" style={{ width: 'auto', padding: '0.35rem 0.625rem', fontSize: '0.8125rem' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Hasta:</label>
              <input type="date" className="input" style={{ width: 'auto', padding: '0.35rem 0.625rem', fontSize: '0.8125rem' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
              {(dateFrom || dateTo) && <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo('') }}>✕ Limpiar</button>}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Prioridad</th>
                    <th>Solicitante</th>
                    <th>Ubicación</th>
                    <th>Creada</th>
                    <th>Resuelta</th>
                    <th>Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {resueltas.map((t: Tarea) => {
                    const horas = getHoursElapsed(t.created_at, t.resuelto_at)
                    const esRapida = typeof horas === 'number' && horas <= 2
                    return (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.titulo}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                            {t.etiquetas?.map(e => (
                              <span key={e.id} style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: 99, background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}35`, fontWeight: 600 }}>
                                {e.nombre}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td><span className={`priority-badge priority-${t.prioridad}`}>{t.prioridad}</span></td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t.solicitante}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.ubicacion ?? '—'}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--priority-baja)', whiteSpace: 'nowrap' }}>
                          {t.resuelto_at ? formatDateTime(t.resuelto_at) : formatDate(t.updated_at)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', fontWeight: 700, color: esRapida ? 'var(--priority-baja)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {horas}h {esRapida && '⚡'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {resueltas.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">Sin tareas resueltas en este período</div>
                  <div className="empty-state-desc">
                    {tareas.length === 0
                      ? 'Aún no hay tareas en el sistema.'
                      : 'Ajusta el rango de fechas o resuelve algunas tareas primero.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      </main>
    </div>
  )
}

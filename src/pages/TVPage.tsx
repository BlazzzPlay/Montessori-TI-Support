import { useState, useEffect } from 'react'
import { useTareas } from '../hooks/useTareas'
import { useHelpCounters } from '../hooks/useHelpCounters'
import { sortForTV, getDeadlineStatus } from '../lib/utils'
import type { Tarea } from '../types'


function TVCardWrapper({ tarea }: { tarea: Tarea }) {
  const ds = getDeadlineStatus(tarea.fecha_limite)
  const dlColors: Record<string, { bg: string; color: string; text: string }> = {
    ok:      { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', text: '✓ A tiempo' },
    today:   { bg: 'rgba(234,179,8,0.15)',  color: '#EAB308', text: '⚠ Vence hoy' },
    soon:    { bg: 'rgba(249,115,22,0.15)', color: '#F97316', text: '⏰ Por vencer' },
    overdue: { bg: 'rgba(239,68,68,0.2)',   color: '#EF4444', text: '🔥 ATRASADA' },
  }
  const dl = dlColors[ds]
  return (
    <div className={`tv-card ${tarea.prioridad}`}>
      <div className="tv-status-bar">
        <span style={{ color: tarea.estado === 'en_progreso' ? '#3B82F6' : 'rgba(255,255,255,0.5)' }}>
          {tarea.estado === 'en_progreso' ? '● EN PROGRESO' : '○ PENDIENTE'}
        </span>
        <span style={{ marginLeft: 'auto', background: dl.bg, color: dl.color, padding: '1px 8px', borderRadius: '99px', fontSize: '0.7rem' }}>
          {dl.text}
        </span>
      </div>

      <div className={`tv-card-priority priority-${tarea.prioridad}`}
        style={{ color: { urgente: '#EF4444', alta: '#F97316', media: '#EAB308', baja: '#22C55E' }[tarea.prioridad] }}>
        {{ urgente: '🔴 URGENTE', alta: '🟠 ALTA', media: '🟡 MEDIA', baja: '🟢 BAJA' }[tarea.prioridad]}
      </div>

      <div className="tv-card-title">{tarea.titulo}</div>

      {tarea.ubicacion && (
        <div className="tv-card-location">📍 {tarea.ubicacion}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div className="tv-card-solicitante">👤 {tarea.solicitante}</div>
        {tarea.fecha_limite && (
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: dl.color }}>
            📅 {new Date(tarea.fecha_limite).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
          </div>
        )}
      </div>

      {tarea.etiquetas && tarea.etiquetas.length > 0 && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {tarea.etiquetas.slice(0,3).map(e => (
            <span key={e.id} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px', background: `${e.color}20`, color: e.color, border: `1px solid ${e.color}40`, fontWeight: 600 }}>
              {e.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function TVPage() {
  const { tareas, loading, refetch } = useTareas()
  const { helpCounters, refresh: refreshHelp } = useHelpCounters()
  const [now, setNow] = useState(new Date())
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refetch()
      refreshHelp()
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [refetch, refreshHelp])

  const active = sortForTV(
    tareas.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso')
  )

  const urgentes = active.filter(t => t.prioridad === 'urgente').length
  const enProgreso = active.filter(t => t.estado === 'en_progreso').length

  const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="tv-panel">
      {/* Header */}
      <div className="tv-header">
        <div>
          <div className="tv-title">🖥️ Panel TI — Colegio</div>
          <div className="tv-subtitle">Información en tiempo real para el equipo de soporte</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tv-clock">{timeStr}</div>
          <div className="tv-date">{dateStr}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }} className="tv-layout-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Activas', value: active.length, color: '#3B82F6' },
              { label: 'Urgentes', value: urgentes, color: '#EF4444' },
              { label: 'En Progreso', value: enProgreso, color: '#22C55E' },
            ].map(st => (
              <div key={st.label} style={{
                background: `${st.color}15`, border: `1px solid ${st.color}35`,
                borderRadius: 12, padding: '0.625rem 1.25rem', display: 'flex', gap: '0.625rem', alignItems: 'center',
                flex: 1, minWidth: '150px'
              }}>
                <span style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 900, color: st.color, fontVariantNumeric: 'tabular-nums' }}>
                  {st.value}
                </span>
                <span style={{ fontSize: 'clamp(0.75rem,1.2vw,0.9375rem)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{st.label}</span>
              </div>
            ))}
          </div>

          {/* Tasks grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)', fontSize: '1.25rem' }}>
              ⏳ Cargando tareas...
            </div>
          ) : active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', borderRadius: 24 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <div style={{ fontSize: 'clamp(1.25rem,2vw,1.75rem)', fontWeight: 700 }}>¡Sin tareas pendientes!</div>
              <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>El equipo de TI está al día.</div>
            </div>
          ) : (
            <div className="tv-grid">
              {active.map(t => <TVCardWrapper key={t.id} tarea={t} />)}
            </div>
          )}
        </div>

        {/* Sidebar for TV: Help Counters Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="tv-sidebar-stats">
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Ayuda Rápida <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>MES</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'apoderados', label: 'Apoderados', color: '#60A5FA', icon: '👨‍👩‍👧‍👦' },
                { key: 'alumnos', label: 'Alumnos', color: '#34D399', icon: '🎓' },
                { key: 'profesores', label: 'Profesores', color: '#FBBF24', icon: '👨‍🏫' },
                { key: 'administrativos', label: 'Administrativos', color: '#818CF8', icon: '🏢' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '1.75rem' }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color }}>{helpCounters[item.key as keyof typeof helpCounters]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 12, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontWeight: 700, color: '#60A5FA', marginBottom: '0.25rem' }}>ℹ️ Nota de Auditoría</div>
            Los contadores arriba reflejan ayudas rápidas que no requieren ticket formal.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
        <span>🔄 Auto-actualización cada 30 segundos</span>
        <span>↻ Actualizado: {lastRefresh.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>TI Montessori — Soporte Escolar</span>
      </div>

      <style>{`
        @media (max-width: 1280px) {
          .tv-layout-grid { grid-template-columns: 1fr !important; }
          .tv-sidebar-stats { order: -1; }
          .tv-sidebar-stats > div { display: grid !important; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .tv-sidebar-stats h3 { grid-column: span 2; }
        }
        @media (max-width: 640px) {
          .tv-sidebar-stats > div { grid-template-columns: 1fr !important; }
          .tv-sidebar-stats h3 { grid-column: span 1; }
          .tv-header { flex-direction: column; gap: 1rem; text-align: center; }
          .tv-header > div { text-align: center !important; }
        }
      `}</style>
    </div>
  )
}

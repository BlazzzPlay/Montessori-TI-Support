import { PriorityBadge, TagBadge, StatusBadge } from '../ui/Badges'
import { formatDate, getDeadlineStatus } from '../../lib/utils'
import type { Tarea } from '../../types'

interface TaskCardProps {
  tarea: Tarea
  onClick?: (t: Tarea) => void
  compact?: boolean
}

export function TaskCard({ tarea, onClick, compact = false }: TaskCardProps) {
  const dlStatus = getDeadlineStatus(tarea.fecha_limite)
  const dlClasses: Record<string, string> = {
    ok: 'deadline-ok', today: 'deadline-today', soon: 'deadline-soon', overdue: 'deadline-overdue'
  }
  const dlLabel: Record<string, string> = {
    ok: 'A tiempo', today: '⚠ Hoy!', soon: '⏰ Pronto', overdue: '🔥 Atrasada'
  }

  return (
    <article
      className={`task-card ${tarea.prioridad} animate-fade`}
      onClick={() => onClick?.(tarea)}
      role="button"
      tabIndex={0}
      aria-label={`Tarea: ${tarea.titulo}`}
      onKeyDown={e => e.key === 'Enter' && onClick?.(tarea)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div className="task-card-title">{tarea.titulo}</div>
        <PriorityBadge prioridad={tarea.prioridad} />
      </div>

      {/* Description */}
      {!compact && tarea.descripcion && (
        <div className="task-card-desc">{tarea.descripcion}</div>
      )}

      {/* Tags */}
      {tarea.etiquetas && tarea.etiquetas.length > 0 && (
        <div className="task-card-meta">
          {tarea.etiquetas.slice(0, 3).map(e => <TagBadge key={e.id} etiqueta={e} />)}
          {tarea.etiquetas.length > 3 && (
            <span className="tag-badge" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)', background: 'var(--bg-hover)' }}>
              +{tarea.etiquetas.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar & Subtasks Summary */}
      {(tarea.mostrar_progreso || (tarea.subtareas && tarea.subtareas.length > 0)) && (
        <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tarea.mostrar_progreso && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Progreso</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{tarea.progreso}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${tarea.progreso}%`, 
                    background: 'var(--brand-500)', 
                    transition: 'width 0.3s ease',
                    borderRadius: '3px'
                  }} 
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {tarea.subtareas && tarea.subtareas.length > 0 && (
              <span style={{ 
                display: 'inline-flex', padding: '2px 6px', borderRadius: '4px',
                background: 'var(--bg-hover)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', fontWeight: 600
              }}>
                📋 {tarea.subtareas.filter(s => s.completada).length}/{tarea.subtareas.length} pasos
              </span>
            )}
            {tarea.comentarios && tarea.comentarios.length > 0 && (
              <span style={{ 
                display: 'inline-flex', padding: '2px 6px', borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                color: '#6366f1', fontWeight: 600, alignItems: 'center', gap: '3px'
              }}>
                💬 {tarea.comentarios.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status (list view) */}
      {compact && <StatusBadge estado={tarea.estado} />}

      {/* Footer */}
      <div className="task-card-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="task-card-solicitante">👤 {tarea.solicitante}</span>
          {tarea.ubicacion && (
            <span className="task-card-location">📍 {tarea.ubicacion}</span>
          )}
        </div>
        {tarea.fecha_limite && (
          <span className={`task-card-deadline ${dlClasses[dlStatus]}`}>
            {dlStatus === 'ok' ? `📅 ${formatDate(tarea.fecha_limite)}` : dlLabel[dlStatus]}
          </span>
        )}
      </div>
    </article>
  )
}

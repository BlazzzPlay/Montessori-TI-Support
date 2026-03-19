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

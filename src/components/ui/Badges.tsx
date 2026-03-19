import type { Prioridad, EstadoTarea, Etiqueta } from '../../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../../lib/utils'

// ---- Priority Badge ----
interface PriorityBadgeProps { prioridad: Prioridad; showIcon?: boolean }
export function PriorityBadge({ prioridad, showIcon = true }: PriorityBadgeProps) {
  const icons: Record<Prioridad, string> = { urgente: '🔴', alta: '🟠', media: '🟡', baja: '🟢' }
  return (
    <span className={`priority-badge priority-${prioridad}`} role="status" aria-label={`Prioridad ${prioridad}`}>
      {showIcon && <span aria-hidden="true">{icons[prioridad]}</span>}
      {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
    </span>
  )
}

// ---- Status Badge ----
interface StatusBadgeProps { estado: EstadoTarea }
export function StatusBadge({ estado }: StatusBadgeProps) {
  const dots: Record<EstadoTarea, string> = {
    solicitud: '📥', pendiente: '○', en_progreso: '◉', resuelto: '●', cerrado: '✓'
  }
  return (
    <span className={`status-badge status-${estado}`} role="status" aria-label={STATUS_LABELS[estado]}>
      <span aria-hidden="true">{dots[estado]}</span>
      {STATUS_LABELS[estado]}
    </span>
  )
}

// ---- Tag Badge ----
interface TagBadgeProps { etiqueta: Etiqueta; size?: 'sm' | 'md' }
export function TagBadge({ etiqueta, size = 'sm' }: TagBadgeProps) {
  const icons: Record<string, string> = {
    soporte: '🎧', reparaciones: '🔧', mantenimiento: '⚙️',
    plataformas: '🖥️', redes: '📡', audiovisual: '🎬'
  }
  return (
    <span
      className="tag-badge"
      style={{
        color: etiqueta.color,
        borderColor: `${etiqueta.color}40`,
        backgroundColor: `${etiqueta.color}12`,
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem'
      }}
    >
      <span aria-hidden="true">{icons[etiqueta.nombre] ?? '📌'}</span>
      {etiqueta.nombre.charAt(0).toUpperCase() + etiqueta.nombre.slice(1)}
    </span>
  )
}

// ---- Priority/Status Select helpers ----
export const PRIORIDAD_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value: value as Prioridad, label }))
export const ESTADO_OPTIONS = Object.entries(STATUS_LABELS)
  .filter(([value]) => value !== 'solicitud')
  .map(([value, label]) => ({ value: value as EstadoTarea, label }))

import { formatInTimeZone } from 'date-fns-tz'
import type { Prioridad, EstadoTarea } from '../types'

export const CHILE_TZ = 'America/Santiago'

// ---- Dates ----
export const now = () => new Date().toISOString()

export const formatDate = (iso?: string): string => {
  if (!iso) return '—'
  return formatInTimeZone(new Date(iso), CHILE_TZ, "dd 'de' MMM, yyyy")
}

export const formatDateTime = (iso?: string): string => {
  if (!iso) return '—'
  return formatInTimeZone(new Date(iso), CHILE_TZ, "dd 'de' MMM, yyyy HH:mm")
}

export const formatTimeOnly = (iso?: string): string => {
  if (!iso) return '—'
  return formatInTimeZone(new Date(iso), CHILE_TZ, "HH:mm")
}

export const getDeadlineStatus = (fechaLimite?: string): 'ok' | 'today' | 'soon' | 'overdue' => {
  if (!fechaLimite) return 'ok'
  const now = new Date()
  const dl = new Date(fechaLimite)
  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 2) return 'soon'
  return 'ok'
}

export const getHoursElapsed = (createdAt: string, resolvedAt?: string): number => {
  const start = new Date(createdAt).getTime()
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now()
  return Math.round((end - start) / (1000 * 60 * 60))
}

// ---- Priority ----
export const PRIORITY_ORDER: Record<Prioridad, number> = {
  urgente: 0, alta: 1, media: 2, baja: 3
}

export const PRIORITY_LABELS: Record<Prioridad, string> = {
  urgente: '🔴 Urgente', alta: '🟠 Alta', media: '🟡 Media', baja: '🟢 Baja'
}

export const STATUS_LABELS: Record<EstadoTarea, string> = {
  solicitud: 'Solicitud',
  pendiente: 'Pendiente', en_progreso: 'En Progreso',
  resuelto: 'Resuelto', cerrado: 'Cerrado'
}

// ---- ID ----
export const genId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36)

// ---- Sort tasks for TV ----
export const sortForTV = <T extends { prioridad: Prioridad; fecha_limite?: string }>(tasks: T[]): T[] =>
  [...tasks].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.prioridad] - PRIORITY_ORDER[b.prioridad]
    if (pDiff !== 0) return pDiff
    if (!a.fecha_limite && !b.fecha_limite) return 0
    if (!a.fecha_limite) return 1
    if (!b.fecha_limite) return -1
    return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime()
  })

// ---- Truncate ----
export const truncate = (str: string, max: number): string =>
  str.length > max ? str.slice(0, max) + '…' : str

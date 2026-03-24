// ============================================================
// TAREAS BLAZZ — TypeScript Types
// ============================================================

export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente'
export type EstadoTarea = 'solicitud' | 'pendiente' | 'en_progreso' | 'resuelto' | 'cerrado'
export type NombreEtiqueta = 'soporte' | 'reparaciones' | 'mantenimiento' | 'plataformas' | 'redes' | 'audiovisual'

export interface Etiqueta {
  id: string
  nombre: NombreEtiqueta
  color: string
  icono: string
}

export interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  solicitante: string
  ubicacion?: string
  prioridad: Prioridad
  estado: EstadoTarea
  fecha_limite?: string
  creado_por?: string
  asignado_a?: string
  created_at: string
  updated_at: string
  resuelto_at?: string
  etiquetas?: Etiqueta[]
  mostrar_auditoria?: boolean
  // Nuevas funcionalidades
  progreso?: number // 0-100
  mostrar_progreso?: boolean
  subtareas?: Subtarea[]
}

export interface Subtarea {
  id: string
  titulo: string
  completada: boolean
  checklist?: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  texto: string
  completada: boolean
}

export interface Comentario {
  id: string
  tarea_id: string
  autor_id?: string
  contenido: string
  created_at: string
}

export interface TareaFormData {
  titulo: string
  descripcion: string
  solicitante: string
  ubicacion: string
  prioridad: Prioridad
  fecha_limite: string
  etiqueta_ids: string[]
  mostrar_auditoria: boolean
  estado?: EstadoTarea
  // Nuevas funcionalidades
  progreso?: number
  mostrar_progreso?: boolean
  subtareas?: Subtarea[]
}

export interface UserProfile {
  id: string
  email: string
  nombre: string
  rol: 'admin' | 'tecnico' | 'viewer'
}

export interface AuditStats {
  totalResueltas: number
  tiempoPromedioHoras?: number // Opcional ahora que lo quitaremos del UI
  masRapidoDelMes?: number
  porcentajeCambioSemanal: number
  estaSemana?: number
}

export interface HelpCounters {
  apoderados: number
  alumnos: number
  profesores: number
  administrativos: number
  lastResetMonth: string // Formato "YYYY-MM"
}

export interface EstadisticaEtiqueta {
  nombre: string
  total: number
  color: string
}

export interface VolumeData {
  mes: string
  total: number
  resueltas: number
}

export interface ResolucionData {
  semana: string
  promedio: number
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type ToastType = 'success' | 'error' | 'info'
export interface Toast {
  id: string
  type: ToastType
  message: string
}
// --- Reserva de Tablets ---
export type TipoSolicitante = 'alumno' | 'profesor'
export type EstadoReserva = 'reservado' | 'en_prestamo' | 'devuelto' | 'cancelado'

export interface ReservaTablet {
  id: string
  solicitante_nombre: string
  solicitante_tipo: TipoSolicitante
  cantidad: number
  curso: string
  fecha_inicio: string
  fecha_fin: string
  fecha_entrega?: string
  fecha_devolucion?: string
  estado: EstadoReserva
  notas?: string
  created_at: string
}

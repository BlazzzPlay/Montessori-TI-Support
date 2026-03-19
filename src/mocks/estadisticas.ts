import type { EstadisticaEtiqueta, VolumeData, ResolucionData, AuditStats } from '../types'

export const MOCK_AUDIT_STATS: AuditStats = {
  totalResueltas: 87,
  tiempoPromedioHoras: 6.4,
  masRapidoDelMes: 0.8,
  porcentajeCambioSemanal: 12
}

export const MOCK_ETIQUETA_STATS: EstadisticaEtiqueta[] = [
  { nombre: 'Soporte',       total: 38, color: '#2563EB' },
  { nombre: 'Plataformas',   total: 26, color: '#7C3AED' },
  { nombre: 'Mantenimiento', total: 17, color: '#6B7280' },
  { nombre: 'Reparaciones',  total: 14, color: '#F97316' },
  { nombre: 'Redes',         total: 10, color: '#16A34A' },
  { nombre: 'Audiovisual',   total: 8,  color: '#DC2626' },
]

export const MOCK_VOLUME_DATA: VolumeData[] = [
  { mes: 'Sep', total: 24, resueltas: 22 },
  { mes: 'Oct', total: 31, resueltas: 28 },
  { mes: 'Nov', total: 19, resueltas: 17 },
  { mes: 'Dic', total: 12, resueltas: 12 },
  { mes: 'Ene', total: 28, resueltas: 24 },
  { mes: 'Feb', total: 35, resueltas: 30 },
  { mes: 'Mar', total: 22, resueltas: 15 },
]

export const MOCK_RESOLUCION_DATA: ResolucionData[] = [
  { semana: 'S1 Feb', promedio: 8.2 },
  { semana: 'S2 Feb', promedio: 5.7 },
  { semana: 'S3 Feb', promedio: 6.9 },
  { semana: 'S4 Feb', promedio: 4.3 },
  { semana: 'S1 Mar', promedio: 7.1 },
  { semana: 'S2 Mar', promedio: 6.4 },
]

import type { Tarea, Etiqueta } from '../types'

export const MOCK_ETIQUETAS: Etiqueta[] = [
  { id: 'e1', nombre: 'soporte',       color: '#2563EB', icono: 'headphones' },
  { id: 'e2', nombre: 'reparaciones',  color: '#F97316', icono: 'wrench' },
  { id: 'e3', nombre: 'mantenimiento', color: '#6B7280', icono: 'settings' },
  { id: 'e4', nombre: 'plataformas',   color: '#7C3AED', icono: 'monitor' },
  { id: 'e5', nombre: 'redes',         color: '#16A34A', icono: 'wifi' },
  { id: 'e6', nombre: 'audiovisual',   color: '#DC2626', icono: 'video' },
]

const d = (offsetDays: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + offsetDays)
  return dt.toISOString()
}

export const MOCK_TAREAS: Tarea[] = [
  {
    id: 't1', titulo: 'Proyector sin señal en Sala A-203',
    descripcion: 'El proyector Epson no detecta la señal HDMI del notebook del profesor. Se intentó cambiar de cable pero persiste el problema.',
    solicitante: 'Prof. Carmen López',
    ubicacion: 'Sala A-203', prioridad: 'urgente', estado: 'pendiente',
    fecha_limite: d(0), created_at: d(-2), updated_at: d(-1),
    etiquetas: [MOCK_ETIQUETAS[5], MOCK_ETIQUETAS[1]]
  },
  {
    id: 't2', titulo: 'Sin internet en Sala de Computación',
    descripcion: 'Todos los equipos del laboratorio de computación perdieron conectividad. Router parece estar funcionando pero los PCs no obtienen IP.',
    solicitante: 'Prof. Mario Pérez',
    ubicacion: 'Lab Computación', prioridad: 'urgente', estado: 'en_progreso',
    fecha_limite: d(0), created_at: d(-1), updated_at: d(0),
    etiquetas: [MOCK_ETIQUETAS[4]]
  },
  {
    id: 't3', titulo: 'Falla en plataforma Google Classroom',
    descripcion: 'Los estudiantes de 3° Medio no pueden acceder al aula virtual. Error de autenticación SSO con la cuenta Google del colegio.',
    solicitante: 'Prof. Ana Muñoz',
    ubicacion: 'Toda la institución', prioridad: 'alta', estado: 'pendiente',
    fecha_limite: d(1), created_at: d(-1), updated_at: d(-1),
    etiquetas: [MOCK_ETIQUETAS[3]]
  },
  {
    id: 't4', titulo: 'Impresora de Secretaría sin papel/tóner',
    descripcion: 'La impresora HP LaserJet de secretaría indica tóner bajo. También necesita resma de papel para continuar operaciones.',
    solicitante: 'Sra. Verónica Torres',
    ubicacion: 'Secretaría', prioridad: 'alta', estado: 'pendiente',
    fecha_limite: d(1), created_at: d(-3), updated_at: d(-3),
    etiquetas: [MOCK_ETIQUETAS[2], MOCK_ETIQUETAS[0]]
  },
  {
    id: 't5', titulo: 'Notebook lento en Sala de Profesores',
    descripcion: 'Un notebook HP del año 2018 presenta lentitud extrema al abrir Chrome y Office. Sospecha de virus o disco duro defectuoso.',
    solicitante: 'Miguel Fernández',
    ubicacion: 'Sala de Profesores', prioridad: 'media', estado: 'pendiente',
    fecha_limite: d(3), created_at: d(-2), updated_at: d(-2),
    etiquetas: [MOCK_ETIQUETAS[0], MOCK_ETIQUETAS[1]]
  },
  {
    id: 't6', titulo: 'Instalar software Geogebra en Lab 2',
    descripcion: 'El profesor de matemática solicita instalación de Geogebra 6 en todos los equipos del laboratorio secundario (20 PCs).',
    solicitante: 'Prof. Jorge Ríos',
    ubicacion: 'Lab Secundario', prioridad: 'media', estado: 'en_progreso',
    fecha_limite: d(4), created_at: d(-1), updated_at: d(0),
    etiquetas: [MOCK_ETIQUETAS[3], MOCK_ETIQUETAS[0]]
  },
  {
    id: 't7', titulo: 'Sistema de audio no funciona en Auditorio',
    descripcion: 'El amplificador del auditorio no enciende. Acto de fin de semestre el próximo viernes. Requiere revisión urgente.',
    solicitante: 'Dirección',
    ubicacion: 'Auditorio', prioridad: 'alta', estado: 'pendiente',
    fecha_limite: d(2), created_at: d(0), updated_at: d(0),
    etiquetas: [MOCK_ETIQUETAS[5], MOCK_ETIQUETAS[1]]
  },
  {
    id: 't8', titulo: 'Configurar cuenta email nueva docente',
    descripcion: 'Nueva profesora de Inglés necesita configuración de cuenta Google Workspace del colegio y acceso a plataformas institucionales.',
    solicitante: 'RRHH',
    ubicacion: 'Oficina TI', prioridad: 'baja', estado: 'pendiente',
    fecha_limite: d(7), created_at: d(0), updated_at: d(0),
    etiquetas: [MOCK_ETIQUETAS[3], MOCK_ETIQUETAS[0]]
  },
  {
    id: 't9', titulo: 'Cambiar mouse roto en Dirección',
    descripcion: 'Mouse del director presenta doble clic involuntario. Requiere reemplazo por nuevo.',
    solicitante: 'Director Marcelo',
    ubicacion: 'Dirección', prioridad: 'baja', estado: 'resuelto',
    fecha_limite: d(-1), created_at: d(-5), updated_at: d(-1), resuelto_at: d(-1),
    etiquetas: [MOCK_ETIQUETAS[1]]
  },
  {
    id: 't10', titulo: 'WiFi débil en Biblioteca',
    descripcion: 'Señal WiFi muy baja en zona de lectura de la biblioteca. Los estudiantes no pueden acceder a recursos digitales.',
    solicitante: 'Bibliotecaria Sara',
    ubicacion: 'Biblioteca', prioridad: 'media', estado: 'resuelto',
    fecha_limite: d(-2), created_at: d(-7), updated_at: d(-2), resuelto_at: d(-2),
    etiquetas: [MOCK_ETIQUETAS[4]]
  },
  {
    id: 't11', titulo: 'Recuperar datos pendrive dañado',
    descripcion: 'Jefa UTP perdió material de planificaciones en pendrive que no es reconocido por el sistema. Intentar recuperación de datos.',
    solicitante: 'UTP Carolina Vega',
    ubicacion: 'Oficina UTP', prioridad: 'alta', estado: 'cerrado',
    fecha_limite: d(-3), created_at: d(-10), updated_at: d(-3), resuelto_at: d(-3),
    etiquetas: [MOCK_ETIQUETAS[0]]
  },
  {
    id: 't12', titulo: 'Actualizar antivirus en todos los equipos',
    descripcion: 'Mantenimiento preventivo mensual: actualizar definiciones de antivirus en los 45 equipos del colegio.',
    solicitante: 'TI (Preventivo)',
    ubicacion: 'Todo el colegio', prioridad: 'baja', estado: 'cerrado',
    fecha_limite: d(-5), created_at: d(-15), updated_at: d(-5), resuelto_at: d(-5),
    etiquetas: [MOCK_ETIQUETAS[2]]
  },
]

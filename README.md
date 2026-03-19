# Montessori TI Support

Sistema integral de gestión de soporte técnico para el Departamento de Informática del **Colegio Montessori**. Diseñado para optimizar la recepción y seguimiento de tickets de servicios, reparaciones y solicitudes tecnológicas.

## ✨ Funcionalidades

- **Dashboard Kanban**: Gestión visual del estado de las tareas (Pendiente, En Progreso, Resuelto).
- **Módulo de Auditoría**: Estadísticas detalladas, KPIs de rendimiento y seguimiento de eficiencia técnica.
- **Solicitud Pública**: Formulario externo para que profesores y colegas envíen tickets sin necesidad de registro.
- **Aprobación TI**: Flujo de revisión donde el personal técnico audita, cataloga y aprueba las solicitudes entrantes.
- **TV Page**: Interfaz optimizada para pantallas grandes, permitiendo monitoreo en tiempo real del estado de los tickets.
- **Buscador IA**: Asistente inteligente para la consulta rápida de datos históricos y estados de tareas.

## 🚀 Despliegue

El proyecto se encuentra desplegado y gestionado a través de **Insforge**.

- **URL de Producción**: [https://jxw3tu8c.insforge.site/](https://jxw3tu8c.insforge.site/)
- **URL de Solicitud Pública**: [https://jxw3tu8c.insforge.site/solicitud](https://jxw3tu8c.insforge.site/solicitud)

### Para realizar un nuevo despliegue:

```bash
npm run build
insforge deployments deploy ./dist
```

## 🛠️ Tecnologías

- **Frontend**: React + Vite
- **Database**: Insforge Database Engine
- **Estilos**: Vanilla CSS (Premium Dark Theme)
- **Deployment**: Insforge CLI

---
*Desarrollado por BlazzzPlay para el Colegio Montessori.*

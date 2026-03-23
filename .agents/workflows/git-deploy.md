---
description: Automatiza el proceso de subir cambios a Git y desplegar el frontend en InsForge.
---

Este workflow simplifica el flujo de trabajo de fin de día o fin de tarea.

// turbo
1. **Validar build local**: `npm run build`
   *Asegura que el código compila sin errores antes de subirlo.*

2. **Agregar y persistir cambios en Git**:
   `git add . ; git commit -m "feat: actualización y despliegue automático" ; git push origin master`

3. **Desplegar en hosting de InsForge**:
   `insforge deployments deploy ./dist -y`
   *Sube la carpeta de producción dist directamente a tu proyecto.*

4. **Verificar estado**: `insforge deployments list --limit 1`

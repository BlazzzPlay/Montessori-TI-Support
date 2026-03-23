---
name: git-deploy
description: >-
  Esta skill permite automatizar el flujo de trabajo de enviar cambios al repositorio de Git y desplegar la aplicación frontend en InsForge utilizando insforge-cli. Incluye pasos para la validación del build local antes de subir.
---

# Git & InsForge Deploy Skill

Esta skill define el procedimiento estándar para este proyecto al finalizar una tarea.

## Requisitos Previos

1. **Git**: El repositorio debe estar inicializado y vinculado a un remote (GitHub).
2. **InsForge CLI**: Debe estar instalado (`npm install -g @insforge/cli`) y autenticado (`insforge login`).
3. **Proyecto Vinculado**: La carpeta debe estar vinculada a un proyecto de InsForge (`insforge link`).

## Flujo de Trabajo Estándar

### 1. Preparación y Build
Antes de cualquier despliegue, es obligatorio validar que la aplicación compila correctamente.

```bash
npm run build
```

### 2. Envío a Git
Una vez validado el build, se deben persistir los cambios en el control de versiones.

```bash
git add .
git commit -m "feat: descripción de los cambios"
git push origin master
```

### 3. Despliegue en InsForge
Finalmente, se despliega la carpeta de distribución (`dist`) al hosting de InsForge.

```bash
insforge deployments deploy ./dist -y
```

## Automatización con Workflows
Para ejecutar este flujo de manera automática, utiliza el comando de workflow:
` /deploy "mensaje del commit" `

## Notas de Seguridad
- Nunca incluyas archivos sensibles como `.env` o `.insforge/project.json` en los comandos de Git.
- Asegúrate de que `dist/` esté en el `.gitignore` si no deseas subir los archivos compilados al repo (recomendado).

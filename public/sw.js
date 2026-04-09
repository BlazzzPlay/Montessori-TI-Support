// Tareas Blazz — Service Worker v2
// Estrategia: Network-first para HTML/JS/CSS, Cache-first para imágenes/fuentes
// Garantiza que nuevas versiones del app se carguen inmediatamente.

const CACHE_VERSION = 'tareas-blazz-v3'
const IMMUTABLE_CACHE = 'tareas-blazz-immutable'

// Patrones de assets que pueden cachearse de forma duradera (sin cambiar nunca su URL)
const IMMUTABLE_PATTERNS = [
  /\/assets\/.+\.(png|jpg|svg|ico|woff2?)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
]

// --- Install: pre-caché del shell mínimo ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(['/', '/manifest.json'])
    )
  )
  // Activar de inmediato sin esperar a que se cierren las pestañas viejas
  self.skipWaiting()
})

// --- Activate: eliminar cachés antigas y tomar control ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== IMMUTABLE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => {
      // Tomar control de todas las pestañas abiertas inmediatamente
      return self.clients.claim()
    }).then(() => {
      // Notificar a todos los clientes que hay una nueva versión → auto-reload
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }))
      })
    })
  )
})

// --- Fetch: lógica de red inteligente ---
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Ignorar peticiones no-GET
  if (req.method !== 'GET') return

  // 1. API de InsForge → siempre red, sin caché
  if (url.hostname.includes('insforge.app') || url.hostname.includes('insforge.io')) {
    event.respondWith(
      fetch(req).catch(() => new Response('{"error":"offline"}', {
        headers: { 'Content-Type': 'application/json' }
      }))
    )
    return
  }

  // 2. Assets inmutables (imágenes, fuentes con hash en URL) → Cache-first
  if (IMMUTABLE_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(
      caches.open(IMMUTABLE_CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        if (cached) return cached
        const response = await fetch(req)
        if (response.ok) cache.put(req, response.clone())
        return response
      })
    )
    return
  }

  // 3. HTML, JS, CSS y navegación → Network-first
  // Intenta siempre la red primero; si falla, sirve de caché.
  // Así el usuario SIEMPRE ve la última versión cuando hay conexión.
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone))
        }
        return response
      }).catch(async () => {
        // Sin red: servir desde caché (modo offline)
        const cached = await caches.match(req)
        return cached ?? caches.match('/') ?? new Response('Offline', { status: 503 })
      })
    )
  }
})

// --- Push Notifications ---
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tareas Blazz', {
      body: data.body || 'Tienes una nueva notificación',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Ver tarea' },
        { action: 'close', title: 'Cerrar' }
      ]
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'open') {
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
  }
})

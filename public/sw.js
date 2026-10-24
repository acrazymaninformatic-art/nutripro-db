/* Service worker de EVSoftware (PWA).
   Política de privacidad y de integridad:
   - NUNCA se cachean navegaciones, HTML autenticado, respuestas de la API,
     documentos, fotografías ni código de la aplicación (_next, .js, .css).
   - Solo se cachean recursos públicos e inmutables de la marca (iconos,
     logo y manifest) para que la app instalada mantenga su identidad.
   - Cualquier otra petición va siempre a la red. Servir chunks JS antiguos
     desde caché rompe la aplicación tras un despliegue ("module factory is
     not available") y puede dejar código obsoleto en un entorno clínico.
   - Al volver al login se purga cualquier caché de ejecución heredada.
*/

const CACHE_VERSION = 'v3'
const STATIC_CACHE = `evsoftware-static-${CACHE_VERSION}`

// Lista cerrada: solo rutas públicas de marca. Nunca JS, CSS ni HTML.
const STATIC_PATHS = new Set(['/manifest.webmanifest', '/logo.png', '/icon-192.png', '/icon-512.png'])

const OFFLINE_HTML =
  '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sin conexión</title><body style="font-family:system-ui;padding:2rem;text-align:center"><h1>Sin conexión</h1><p>No hay conexión a internet. Vuelve a intentarlo cuando recuperes la señal.</p></body></html>'

async function deleteLegacyCaches() {
  const keys = await caches.keys()
  await Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))
}

self.addEventListener('install', (event) => {
  // Sin precarga: la caché de marca se llena con el uso normal y así la
  // instalación no depende de la red ni puede quedarse a medias.
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteLegacyCaches().then(() => self.clients.claim()))
})

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type
  if (type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }
  if (type === 'CLEAR_CACHES') {
    // Se conserva únicamente la caché de marca; el resto se elimina.
    event.waitUntil(deleteLegacyCaches())
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  // Navegaciones: siempre red. Sin conexión se devuelve un aviso genérico sin
  // datos clínicos; jamás HTML autenticado desde caché.
  if (request.mode === 'navigate') {
    if (url.pathname === '/login') {
      event.waitUntil(deleteLegacyCaches())
    }
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
          })
      )
    )
    return
  }

  // La API y los archivos privados nunca pasan por el service worker.
  if (url.pathname.startsWith('/api/')) return

  // Única caché permitida: los recursos de marca. Cualquier otro recurso
  // (incluido _next/static, JS y CSS) lo resuelve el navegador contra la red.
  if (!STATIC_PATHS.has(url.pathname)) return

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(url.pathname)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) cache.put(url.pathname, response.clone()).catch(() => undefined)
      return response
    })
  )
})

self.addEventListener('push', (event) => {
  let payload = { title: 'EVSoftware', body: 'Tienes novedades en tu portal.', url: '/paciente' }

  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    // Payload con formato inesperado: usamos el mensaje por defecto.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/paciente'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})

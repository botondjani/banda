// Push-kezelés; a Workbox service worker importálja (vite.config.ts → workbox.importScripts).
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Banda', {
      body: data.body,
      icon: 'icon-192.png',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data.url.replace(/^\//, ''), self.registration.scope).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.registration.scope))
      if (open) return open.navigate(url).then((w) => (w || open).focus())
      return self.clients.openWindow(url)
    }),
  )
})

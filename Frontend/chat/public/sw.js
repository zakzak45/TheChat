self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'New notification', body: event.data ? event.data.text() : 'You have a new notification' };
  }

  const title = data.title || 'TheChat';
  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then( windowClients => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(url) && 'focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});

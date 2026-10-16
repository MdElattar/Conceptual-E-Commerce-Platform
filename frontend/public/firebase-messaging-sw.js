importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCw8LNNaziS3FssPrPvJ3Sq7nkwCs-gUD4",
  projectId: "ahmed-66b8e",
  messagingSenderId: "941132699481",
  appId: "1:941132699481:web:bfa6e140b5aa4997de9e48"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
  self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // اقفل الإشعار فوراً في الماك

  const targetUrl = 'http://localhost:5173/my-orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // فتش في التابات المفتوحة: لو لقيت تابة للموقع، اعمل عليها فوكس وحولها للرابط
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes('/my-orders') && 'focus' in client) {
            return client.focus();
          }
        }
        // لو مفيش أي تابة مفتوحة للموقع، افتح واحدة جديدة بأمان
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
});
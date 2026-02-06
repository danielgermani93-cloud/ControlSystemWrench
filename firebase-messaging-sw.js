// Service Worker per Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configurazione Firebase (sostituisci con le tue credenziali)
const firebaseConfig = {
    apiKey: "AIzaSyBLhRl-xxxxxxxxxxxxxxxxxxx",
    authDomain: "control-wrench.firebaseapp.com",
    projectId: "control-wrench",
    storageBucket: "control-wrench.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:xxxxxxxxxxxxx"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gestione notifiche in background
messaging.onBackgroundMessage((payload) => {
    console.log('Notifica in background ricevuta:', payload);
    
    const notificationTitle = payload.notification.title || 'Control System Wrench';
    const notificationOptions = {
        body: payload.notification.body || 'Nuova notifica',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        tag: 'control-wrench-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Apri App'
            },
            {
                action: 'close',
                title: 'Chiudi'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestione click sulla notifica
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

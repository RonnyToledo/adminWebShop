// public/service-worker.js
self.addEventListener("message", (event) => {
  if (event.data.type === "PUSH_NOTIFICATION") {
    const notification = event.data.data;

    console.log(notification);
    console.log("Notification Received");
    const options = {
      body: notification.message,
      icon: "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png",
      badge:
        "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png",
      data: {
        url: "/admin", // URL a abrir cuando se hace clic
      },
    };

    self.registration.showNotification(notification.title, options);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});

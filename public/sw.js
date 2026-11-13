self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "RouAdmin", body: event.data.text() };
  }

  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title
      : "RouAdmin";
  const body = typeof payload.body === "string" ? payload.body : "";
  const requestedLink =
    typeof payload.data?.link === "string" &&
    payload.data.link.startsWith("/") &&
    !payload.data.link.startsWith("//")
      ? payload.data.link
      : "/notifications";
  let link = "/notifications";
  try {
    const parsedLink = new URL(requestedLink, self.location.origin);
    if (parsedLink.origin === self.location.origin) {
      link = parsedLink.href;
    }
  } catch {
    link = "/notifications";
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/rouai-guide.svg",
      badge: "/rouai-guide.svg",
      tag: typeof payload.tag === "string" ? payload.tag : "rouadmin-notification",
      data: { link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/notifications";
  let destination = new URL("/notifications", self.location.origin).href;
  try {
    const parsedLink = new URL(link, self.location.origin);
    if (parsedLink.origin === self.location.origin) destination = parsedLink.href;
  } catch {
    destination = new URL("/notifications", self.location.origin).href;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windowClients) => {
        const existing = windowClients.find((client) => client.url === destination);
        if (existing) return existing.focus();
        return self.clients.openWindow(destination);
      },
    ),
  );
});

import { supabase } from "@/lib/supa";

export const subscribeToNotifications = async (userId) => {
  console.log(userId);
  const channel = supabase
    .channel("custom-insert-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT", // Escucha las nuevas notificaciones
        schema: "public",
        table: "Notification",
      },
      (payload) => {
        console.log("Nueva notificación:", payload.new);

        // Envía la notificación al Service Worker
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.active.postMessage({
              type: "PUSH_NOTIFICATION",
              data: payload.new,
            });
          });
        }
      }
    )
    .subscribe();

  return channel;
};

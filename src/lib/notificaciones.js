/* @/lib/notificaciones
import { supabase } from "./supa";

export const subscribeUserToPush = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.error("Notificaciones Push no son compatibles en este navegador.");
    return;
  }

  // Obtén el usuario actual desde Supabase
  const userSession = await fetchUserSession();
  const user = userSession.user.id;

  if (!user) {
    console.error(
      "Usuario no autenticado. No se puede registrar la suscripción."
    );
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_TU_CLAVE_PUBLICA_VAPID
    ),
  });


  // Guarda la suscripción en tu tabla `subscriptions` de Supabase
  const { data, error } = await supabase.from("subscriptions").upsert([
    {
      user_id: user, // Asocia el `user_id` del usuario autenticado
      subscription,
    },
  ]);

  if (error) {
    console.error("Error guardando la suscripción:", error);
  } else {
  }
};

// Utilidad para convertir la clave VAPID
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};
async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.id) {
      return data;
    } else {
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
  }
}
*/

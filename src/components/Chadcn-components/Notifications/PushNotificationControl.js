"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

function toApplicationServerKey(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function hasExpectedApplicationServerKey(subscription, publicKey) {
  const currentKey = subscription.options.applicationServerKey;
  if (!currentKey) return false;
  const current = new Uint8Array(currentKey);
  const expected = toApplicationServerKey(publicKey);
  return (
    current.length === expected.length &&
    current.every((value, index) => value === expected[index])
  );
}

export default function PushNotificationControl({ userId }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const available =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(available);
    if (!available) return;

    setPermission(Notification.permission);
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (registration) => {
        const activeSubscription =
          await registration.pushManager.getSubscription();
        setSubscription(activeSubscription);
        if (activeSubscription && userId) {
          const response = await fetch("/api/push-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(activeSubscription),
          });
          if (!response.ok) {
            throw new Error("No se pudo asociar la suscripción a esta cuenta.");
          }
        }
      })
      .catch((error) => {
        console.error("[admin-push] Service Worker setup failed:", error);
        setMessage("No se pudo iniciar el servicio de notificaciones.");
      });
  }, [userId]);

  async function enableNotifications() {
    if (!userId) {
      setMessage("Inicia sesión para activar las notificaciones.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setMessage("No se concedió permiso para las notificaciones.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let activeSubscription =
        await registration.pushManager.getSubscription();
      if (
        activeSubscription &&
        !hasExpectedApplicationServerKey(activeSubscription, vapidKey)
      ) {
        const deleteResponse = await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: activeSubscription.endpoint }),
        });
        if (!deleteResponse.ok) {
          throw new Error("No se pudo reemplazar la suscripción anterior.");
        }
        await activeSubscription.unsubscribe();
        activeSubscription = null;
      }
      if (!activeSubscription) {
        activeSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toApplicationServerKey(vapidKey),
        });
      }

      const response = await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(activeSubscription),
      });
      const resultBody = await response.json();
      if (!response.ok) {
        throw new Error(resultBody.error || `HTTP ${response.status}`);
      }

      setSubscription(activeSubscription);
      setMessage("Notificaciones push activadas para esta cuenta.");
    } catch (error) {
      console.error("[admin-push] Could not enable notifications:", error);
      setMessage(error.message || "No se pudieron activar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications() {
    if (!subscription) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/push-subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      const resultBody = await response.json();
      if (!response.ok) {
        throw new Error(resultBody.error || `HTTP ${response.status}`);
      }
      await subscription.unsubscribe();
      setSubscription(null);
      setMessage("Notificaciones push desactivadas.");
    } catch (error) {
      console.error("[admin-push] Could not disable notifications:", error);
      setMessage(error.message || "No se pudieron desactivar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "RouAdmin",
          message: "Las notificaciones de esta cuenta están funcionando.",
          userId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      if (result.sent === 0) {
        setMessage("No hay una suscripción push activa para esta cuenta.");
        return;
      }
      setMessage(`Notificación de prueba enviada (${result.sent}).`);
    } catch (error) {
      console.error("[admin-push] Test notification failed:", error);
      setMessage(error.message || "No se pudo enviar la prueba.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted-foreground">
        Este navegador no admite notificaciones push.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {subscription ? (
        <>
          <button
            type="button"
            onClick={sendTestNotification}
            disabled={loading || !userId}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
            Enviar prueba
          </button>
          <button
            type="button"
            onClick={disableNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
          >
            <BellOff size={16} />
            Desactivar
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={enableNotifications}
          disabled={loading || !userId || permission === "denied"}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
          Activar en este dispositivo
        </button>
      )}
      {permission === "denied" ? (
        <p className="w-full text-xs text-muted-foreground">
          El permiso está bloqueado en los ajustes del navegador.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="w-full text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}

"use client";
import { useContext, useEffect, useState } from "react";
import { Bell, BellOff, Check, CheckCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supa";
import { ThemeContext } from "@/context/useContext";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "@formkit/tempo";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No vistas" },
  { id: "read", label: "Vistas" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-secondary shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── NotificationItem ─────────────────────────────────────────────────────────
function NotificationItem({ notif, onMarkRead }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-0 transition-colors ${
        !notif.visto
          ? "bg-primary/5 hover:bg-primary/8"
          : "hover:bg-secondary/30"
      }`}
    >
      {/* Icono */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          !notif.visto ? "bg-primary/15" : "bg-secondary"
        }`}
      >
        {notif.visto ? (
          <BellOff size={14} className="text-muted-foreground" />
        ) : (
          <Bell size={14} className="text-primary" />
        )}
      </div>

      {/* Contenido */}
      <a href={notif.link || "#"} className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${!notif.visto ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {notif.mensaje}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {notif.created_at ? format(new Date(notif.created_at), "full") : "—"}
        </p>
      </a>

      {/* Acción marcar como leída */}
      {!notif.visto && (
        <button
          onClick={() => onMarkRead(notif.id)}
          title="Marcar como vista"
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors mt-0.5"
        >
          <Check size={14} />
        </button>
      )}

      {/* Dot de no leída */}
      {!notif.visto && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { webshop } = useContext(ThemeContext);
  const userId = webshop?.user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  console.log(notifications);
  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    async function fetchNotifications() {
      setLoading(true);
      const { data, error } = await supabase
        .from("Notification")
        .select("*")
        .eq("userID", userId)
        .order("created_at", { ascending: false });

      if (!error && data) setNotifications(data);
      setLoading(false);
    }

    fetchNotifications();

    // Suscripción en tiempo real a nuevas notificaciones
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userID=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n)),
            );
          }
          if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── Marcar una como vista ────────────────────────────────────────────────
  async function markAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, visto: true } : n)),
    );
    await supabase.from("Notification").update({ visto: true }).eq("id", id);
  }

  // ── Marcar todas como vistas ─────────────────────────────────────────────
  async function markAllAsRead() {
    if (!userId) return;
    setMarking(true);
    const unreadIds = notifications.filter((n) => !n.visto).map((n) => n.id);
    if (unreadIds.length === 0) {
      setMarking(false);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, visto: true })));
    await supabase
      .from("Notification")
      .update({ visto: true })
      .in("id", unreadIds);
    setMarking(false);
  }

  // ── Filtrado por tab ─────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeTab === "unread") return !n.visto;
    if (activeTab === "read") return n.visto;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.visto).length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5  mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-foreground italic leading-tight">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount} sin leer
            </p>
          )}
        </div>

        {/* Marcar todas */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={marking}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40 shrink-0 mt-1"
          >
            {marking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCheck size={12} />
            )}
            <span className="hidden sm:inline">Marcar todas</span>
            <span className="sm:hidden">Leer todo</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.id === "unread" && unreadCount > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        {loading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Bell size={20} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {activeTab === "unread" ? "Todo leído" : "Sin notificaciones"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "unread"
                  ? "No tienes notificaciones pendientes"
                  : "Las notificaciones aparecerán aquí"}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onMarkRead={markAsRead}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Resumen */}
      {!loading && notifications.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          {notifications.length} notificación
          {notifications.length !== 1 ? "es" : ""} · {unreadCount} sin leer
        </p>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  UserPlus,
  Mail,
  Check,
  X,
  Loader2,
  Store,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { authService } from "@/lib/supabase";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    bg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    label: "Solicitud pendiente",
    desc: "El administrador está revisando tu solicitud.",
  },
  approved: {
    icon: CheckCircle,
    bg: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    label: "¡Aprobado!",
    desc: "Tu tienda fue creada.",
    action: { label: "Ir al Dashboard", href: "/" },
  },
  rejected: {
    icon: AlertCircle,
    bg: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
    label: "Solicitud rechazada",
    desc: "Contacta con soporte para más información.",
  },
};

const ROLE_LABELS = {
  admin: "Admin",
  editor: "Editor",
  analyst: "Analista",
  support: "Soporte",
};

export default function WelcomeComponent({ user }) {
  const [ownerRequest, setOwnerRequest] = useState(null); // última solicitud de tienda propia
  const [pendingInvites, setPendingInvites] = useState([]); // invitaciones recibidas
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningInvite, setActioningInvite] = useState(null); // id del invite en acción
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [reqRes, invRes] = await Promise.all([
          fetch("/api/user/request-owner"),
          fetch("/api/user/invites"), // nuevo endpoint (ver abajo)
        ]);

        const reqData = await reqRes.json();
        const invData = await invRes.json();

        if (reqData.requests?.length > 0) {
          // Ordenar por fecha y tomar la más reciente
          const sorted = [...reqData.requests].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          );
          setOwnerRequest(sorted[0]);
        }

        if (invData.invites) {
          setPendingInvites(invData.invites);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── solicitar tienda ─────────────────────────────────────────────────────
  async function handleRequestStore() {
    setError(null);
    setSubmitting(true);
    window.open(
      "https://wa.me/5352489105?text=Hola,%20quiero%20solicitar%20una%20tienda",
      "_blank",
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authService.signOut();
      window.location.replace("/login");
    } catch (e) {
      setLoggingOut(false);
      toast.error("No se pudo cerrar sesión", {
        description: e.message || "Intenta nuevamente.",
      });
    }
  }

  // ─── cancelar solicitud de tienda ─────────────────────────────────────────
  async function handleCancelRequest() {
    if (!ownerRequest?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/user/request-owner?id=${ownerRequest.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cancelar");
      setOwnerRequest(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── helpers UI ──────────────────────────────────────────────────────────
  const statusInfo = ownerRequest?.status
    ? STATUS_CONFIG[ownerRequest.status]
    : null;

  const hasPendingRequest = ownerRequest?.status === "pending";
  const hasRejectedRequest = ownerRequest?.status === "rejected";
  const showRequestForm = !ownerRequest || hasRejectedRequest;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="text-center flex-1 space-y-1">
            <h1 className="text-3xl font-bold text-white">
              Bienvenido{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-slate-400 text-sm">
              {pendingInvites.length > 0
                ? "Tenés invitaciones pendientes para unirte a un equipo"
                : "Elegí cómo querés comenzar"}
            </p>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Invitaciones recibidas ── */}
        {pendingInvites.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
              <Mail size={15} className="text-slate-300" />
              <h2 className="text-sm font-medium text-white">
                Invitaciones recibidas
              </h2>
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                {pendingInvites.length}
              </span>
            </div>

            {pendingInvites.map((inv) => {
              const isActioning = actioningInvite === inv.id;
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Store size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {inv.store_name ?? "Tienda"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Rol:{" "}
                      <span className="text-slate-300 font-medium">
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={isActioning}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-40"
                      title="Rechazar"
                    >
                      {isActioning ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                    <button
                      disabled={isActioning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                      title="Aceptar"
                    >
                      {isActioning ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={12} /> Aceptar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Estado de solicitud de tienda propia ── */}
        {statusInfo && ownerRequest && (
          <div
            className={`flex items-start gap-3 p-4 border-2 rounded-2xl ${statusInfo.bg}`}
          >
            <statusInfo.icon
              size={18}
              className={`shrink-0 mt-0.5 ${statusInfo.iconColor}`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${statusInfo.iconColor}`}>
                {statusInfo.label}
              </p>
              <p className="text-sm text-slate-600 mt-0.5">{statusInfo.desc}</p>
              {statusInfo.action && (
                <Link href={statusInfo.action.href}>
                  <button className="mt-2 px-4 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
                    {statusInfo.action.label}
                  </button>
                </Link>
              )}
            </div>
            {/* Cancelar solicitud pendiente */}
            {hasPendingRequest && (
              <button
                onClick={handleCancelRequest}
                disabled={submitting}
                className="shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Cancelar solicitud"
              >
                {submitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            )}
          </div>
        )}

        {/* ── Opciones para nuevos usuarios ── */}
        {showRequestForm && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Crear tienda */}
            <div className="bg-white/5 border border-white/10 hover:border-primary/50 rounded-2xl p-5 space-y-4 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Plus size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Crear mi tienda
                  </p>
                  <p className="text-xs text-slate-400">Solicitud a un admin</p>
                </div>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <Check size={11} className="text-primary" /> Sé dueño (owner)
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={11} className="text-primary" /> Control total de
                  productos
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={11} className="text-primary" /> Gestioná tu
                  equipo
                </li>
              </ul>
              <button
                onClick={handleRequestStore}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Solicitar tienda
              </button>
            </div>

            {/* Unirse a equipo */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <UserPlus size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Unirme a un equipo
                  </p>
                  <p className="text-xs text-slate-400">Esperando invitación</p>
                </div>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <Check size={11} className="text-green-400" /> Roles
                  específicos
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={11} className="text-green-400" /> Sin admin
                  overhead
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={11} className="text-green-400" /> Empezá a
                  colaborar
                </li>
              </ul>
              <div className="py-2 px-3 bg-white/5 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <Mail size={12} className="shrink-0" />
                Pedile a un owner que te haga colaborador
              </div>
            </div>
          </div>
        )}

        {/* Soporte */}
        <p className="text-center text-xs text-slate-500">
          ¿Necesitás ayuda?{" "}
          <Link
            href="/contact"
            className="text-slate-400 hover:text-white transition-colors underline underline-offset-2"
          >
            Contactar soporte
          </Link>
        </p>
        <div className="flex items-center justify-center mt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}

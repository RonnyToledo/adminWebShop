"use client";
// ─── components/AccountSwitcher.jsx ──────────────────────────────────────────
// Dropdown de multi-cuenta integrado en el footer del AppSidebar.
// Diseño coherente con el sidebar existente (amber / gray / Tailwind).

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Plus, LogOut, Check, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAccountSwitcher } from "@/lib/useAccountSwitcher";
import { toast } from "sonner";

// Iniciales a partir del nombre o email
function initials(name, email) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export default function AccountSwitcher({ webshop, onSignOut }) {
  const router = useRouter();
  const { accounts, activeId, switching, switchTo, removeAccount } =
    useAccountSwitcher();

  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(null); // id de la cuenta en proceso de remove
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !toggleRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSwitch = async (id) => {
    if (switching) return;
    try {
      setOpen(false);
      await switchTo(id);
    } catch (err) {
      toast.error("No se pudo cambiar de cuenta", { description: err.message });
    }
  };

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    setRemoving(id);
    try {
      await removeAccount(id);
    } catch (err) {
      toast.error("Error al eliminar cuenta", { description: err.message });
    } finally {
      setRemoving(null);
    }
  };

  const otherAccounts = accounts.filter((a) => a.id !== activeId);
  const hasOthers = otherAccounts.length > 0;

  return (
    <div className="relative">
      {/* ── Panel flotante ── */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute bottom-full left-0 right-0 mb-2 z-[60]",
            "bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/60",
            "overflow-hidden",
          )}
        >
          {/* Header del panel */}
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Cuentas
            </p>
          </div>

          {/* Cuenta activa */}
          <div className="px-3 py-2">
            <ActiveAccountRow
              account={accounts.find(
                (a) => a.id === (activeId || webshop?.user?.id),
              )}
              webshop={webshop}
            />
          </div>

          {/* Otras cuentas */}
          {hasOthers && (
            <>
              <div className="mx-3 border-t border-gray-100" />
              <div className="px-3 py-2 space-y-0.5">
                {otherAccounts
                  .filter((a) => a.id !== (activeId || webshop?.user?.id))
                  .map((account) => (
                    <OtherAccountRow
                      key={account.id}
                      account={account}
                      loading={switching && activeId !== account.id}
                      removing={removing === account.id}
                      onSwitch={() => handleSwitch(account.id)}
                      onRemove={(e) => handleRemove(e, account.id)}
                    />
                  ))}
              </div>
            </>
          )}

          {/* Footer acciones */}
          <div className="mx-3 border-t border-gray-100" />
          <div className="px-3 py-2 space-y-0.5">
            {/* Añadir cuenta */}
            <Link
              href="/login?add=true"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                "transition-colors duration-150",
              )}
            >
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Plus size={14} className="text-gray-500" />
              </span>
              <span>Añadir cuenta</span>
            </Link>

            {/* Cerrar sesión de la cuenta activa */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut?.();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-sm text-red-500 hover:bg-red-50",
                "transition-colors duration-150",
              )}
            >
              <span className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <LogOut size={14} className="text-red-400" />
              </span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Botón trigger (reemplaza la fila de usuario del sidebar) ── */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className={cn(
          "w-full flex items-center gap-3 px-2 py-2 rounded-xl",
          "hover:bg-gray-50 transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
        )}
      >
        {switching ? (
          <span className="w-8 h-8 flex items-center justify-center shrink-0">
            <Loader2 size={18} className="animate-spin text-amber-500" />
          </span>
        ) : (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage
              src={webshop?.user?.image || ""}
              alt={webshop?.user?.name || "Usuario"}
            />
            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
              {initials(webshop?.user?.name, webshop?.user?.email)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
            {switching ? "Cambiando cuenta…" : webshop?.user?.name || "Usuario"}
          </p>
          <p className="text-[11px] text-gray-400 truncate leading-tight">
            {webshop?.store_role ?? "owner"}
            {accounts.length > 1 && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-500 font-medium">
                · {accounts.length} cuentas
              </span>
            )}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={cn(
            "text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ActiveAccountRow({ account, webshop }) {
  const name = account?.name ?? webshop?.user?.name ?? "Usuario";
  const email = account?.email ?? webshop?.user?.email ?? "";
  const image = account?.avatar ?? webshop?.user?.image ?? "";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50">
      <Avatar className="w-8 h-8 shrink-0 ring-2 ring-amber-200">
        <AvatarImage src={image} alt={name} />
        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
          {initials(name, email)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
          {name}
        </p>
        <p className="text-[11px] text-gray-500 truncate">{email}</p>
        {webshop?.store?.name && (
          <p className="text-[10px] text-amber-600 font-medium truncate">
            {webshop.store.name}
          </p>
        )}
      </div>
      <Check size={14} className="text-amber-500 shrink-0" />
    </div>
  );
}

function OtherAccountRow({ account, loading, removing, onSwitch, onRemove }) {
  return (
    <button
      type="button"
      onClick={onSwitch}
      disabled={loading || removing}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
        "text-left transition-colors duration-150",
        loading || removing
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-50 cursor-pointer",
      )}
    >
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={account.avatar || ""} alt={account.name || ""} />
        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-semibold">
          {initials(account.name, account.email)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate leading-tight">
          {account.name || account.email}
        </p>
        {account.name && (
          <p className="text-[11px] text-gray-400 truncate">{account.email}</p>
        )}
        {account.store_name && (
          <p className="text-[10px] text-gray-400 truncate">
            {account.store_name}
          </p>
        )}
      </div>

      {/* Quitar cuenta (sin cerrar sesión) */}
      <span
        role="button"
        tabIndex={0}
        onClick={onRemove}
        onKeyDown={(e) => e.key === "Enter" && onRemove(e)}
        aria-label="Quitar cuenta de la lista"
        className={cn(
          "p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50",
          "transition-colors duration-150 shrink-0",
        )}
      >
        {removing ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <X size={12} />
        )}
      </span>
    </button>
  );
}

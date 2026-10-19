"use client";
// ─── lib/useAccountSwitcher.js ────────────────────────────────────────────────
// Multi-account manager estilo Gmail.
// Persiste sesiones en localStorage bajo la key "rmu_accounts".
// Supabase sólo soporta UNA sesión activa por cliente; para cambiar de cuenta
// se llama a supabase.auth.setSession() con los tokens almacenados.
//
// Estructura de cada account:
// {
//   id:            string  (user.id de Supabase)
//   email:         string
//   name:          string | null
//   avatar:        string | null
//   access_token:  string
//   refresh_token: string
//   store_name:    string | null   (nombre de la tienda, opcional)
//   addedAt:       number          (timestamp)
// }

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const STORAGE_KEY = "rmu_accounts";
const MAX_ACCOUNTS = 5;

// ─── helpers de storage ───────────────────────────────────────────────────────
function readAccounts() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeAccounts(accounts) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// ─── hook principal ───────────────────────────────────────────────────────────
export function useAccountSwitcher() {
  const [accounts, setAccounts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [switching, setSwitching] = useState(false);
  const supabase = useRef(null);

  // Inicializar
  useEffect(() => {
    supabase.current = getSupabaseClient();
    const stored = readAccounts();
    setAccounts(stored);
  }, []);

  // Guardar en storage cada vez que cambia la lista
  useEffect(() => {
    if (accounts.length > 0) writeAccounts(accounts);
  }, [accounts]);

  /**
   * Registra (o actualiza) una cuenta en la lista de cuentas guardadas.
   * Debe llamarse tras un login exitoso, pasando la sesión y datos del usuario.
   *
   * @param {import("@supabase/supabase-js").Session} session
   * @param {import("@supabase/supabase-js").User}    user
   * @param {object} [extra]  - { name, avatar, store_name }
   * @param {boolean} remember - true → persiste; false → no agrega a la lista
   */
  const registerAccount = useCallback(
    (session, user, extra = {}, remember = true) => {
      if (!remember) {
        setActiveId(user.id);
        return;
      }
      const newAccount = {
        id: user.id,
        email: user.email,
        name: extra.name ?? user.user_metadata?.name ?? null,
        avatar: extra.avatar ?? user.user_metadata?.avatar_url ?? null,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        store_name: extra.store_name ?? null,
        addedAt: Date.now(),
      };

      setAccounts((prev) => {
        const exists = prev.findIndex((a) => a.id === user.id);
        let updated;
        if (exists >= 0) {
          // Actualizar tokens (pueden haber rotado)
          updated = prev.map((a) =>
            a.id === user.id ? { ...a, ...newAccount } : a,
          );
        } else if (prev.length >= MAX_ACCOUNTS) {
          // Reemplazar la cuenta más antigua
          const sorted = [...prev].sort((a, b) => a.addedAt - b.addedAt);
          updated = prev.filter((a) => a.id !== sorted[0].id);
          updated.push(newAccount);
        } else {
          updated = [...prev, newAccount];
        }
        writeAccounts(updated);
        return updated;
      });

      setActiveId(user.id);
    },
    [],
  );

  /**
   * Cambia la sesión activa de Supabase a la cuenta indicada.
   * Recarga la página para que el contexto (ThemeContext / MyProvider) se reinicie limpio.
   *
   * @param {string} accountId - el id de la cuenta destino
   */
  const switchTo = useCallback(
    async (accountId) => {
      if (accountId === activeId) return;
      const account = accounts.find((a) => a.id === accountId);
      if (!account) throw new Error("Cuenta no encontrada");

      setSwitching(true);
      try {
        const { error } = await supabase.current.auth.setSession({
          access_token: account.access_token,
          refresh_token: account.refresh_token,
        });
        if (error) throw error;

        // Actualizar tokens refrescados si Supabase los rotó
        const {
          data: { session },
        } = await supabase.current.auth.getSession();
        if (session) {
          setAccounts((prev) =>
            prev.map((a) =>
              a.id === accountId
                ? {
                    ...a,
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                  }
                : a,
            ),
          );
        }

        setActiveId(accountId);
        // Reload limpio para que MyProvider reinicie el contexto de tienda
        window.location.assign("/");
      } catch (err) {
        const invalidSession =
          [
            "invalid_grant",
            "invalid_refresh_token",
            "refresh_token_not_found",
          ].includes(err?.code) ||
          /refresh token|invalid jwt|jwt expired/i.test(err?.message ?? "");

        if (invalidSession) {
          setAccounts((prev) => {
            const updated = prev.filter((a) => a.id !== accountId);
            writeAccounts(updated);
            return updated;
          });
        }
        setSwitching(false);
        throw err;
      }
    },
    [accounts, activeId],
  );

  /**
   * Elimina una cuenta de la lista guardada.
   * Si es la activa, también cierra sesión en Supabase.
   */
  const removeAccount = useCallback(
    async (accountId) => {
      const isActive = accountId === activeId;

      setAccounts((prev) => {
        const updated = prev.filter((a) => a.id !== accountId);
        writeAccounts(updated);
        return updated;
      });

      if (isActive) {
        await supabase.current?.auth.signOut();
        setActiveId(null);
        window.location.assign("/login");
      }
    },
    [activeId],
  );

  /**
   * Actualiza los tokens de la cuenta activa (llamar tras token refresh).
   */
  const refreshActiveTokens = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.current.auth.getSession();
    if (!session || !activeId) return;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === activeId
          ? {
              ...a,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }
          : a,
      ),
    );
  }, [activeId]);

  return {
    accounts,
    activeId,
    switching,
    registerAccount,
    switchTo,
    removeAccount,
    refreshActiveTokens,
  };
}

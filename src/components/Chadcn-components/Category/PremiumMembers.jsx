"use client";
import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { Loader2, Search, UserPlus, Crown, X, Mail } from "lucide-react";
import Image from "next/image";
import { logoAdmin } from "@/utils/image";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "@/context/useContext";

export default function PremiumMembers({ initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const storeId = webshop?.store?.UUID;
  const sitioweb = webshop?.store?.sitioweb;

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);

  const fetchMembers = useCallback(async () => {
    if (!storeId || !sitioweb) return;
    setLoadingMembers(true);
    try {
      const res = await apiClient.get(`/api/tienda/${sitioweb}/premium`, {
        params: { storeId },
      });
      setMembers(res?.data?.data || []);
    } catch (error) {
      toast.error("No se pudieron cargar los clientes Premium", {
        description: error?.response?.data?.message || error?.message,
      });
    } finally {
      setLoadingMembers(false);
    }
  }, [storeId, sitioweb]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Búsqueda con debounce de clientes candidatos
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!search || search.trim().length < 2) {
      setCandidates([]);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/api/tienda/${sitioweb}/premium`, {
          params: { storeId, q: search.trim() },
        });
        setCandidates(res?.data?.data || []);
      } catch (error) {
        toast.error("Error buscando clientes", {
          description: error?.response?.data?.message || error?.message,
        });
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [search, storeId, sitioweb]);

  const addMember = async (userId) => {
    setAddingId(userId);
    try {
      await toast.promise(
        apiClient.post(`/api/tienda/${sitioweb}/premium`, { storeId, userId }),
        {
          loading: "Agregando cliente...",
          success: () => {
            fetchMembers();
            setCandidates((prev) =>
              prev.map((c) =>
                c.user_id === userId ? { ...c, is_premium: true } : c,
              ),
            );
            return "Cliente agregado como Premium";
          },
          error: (err) =>
            err?.response?.data?.message || err?.message || "Error al agregar",
        },
      );
    } finally {
      setAddingId(null);
    }
  };

  const toggleActive = async (userId, active) => {
    setTogglingId(userId);
    try {
      await toast.promise(
        apiClient.patch(`/api/tienda/${sitioweb}/premium`, {
          storeId,
          userId,
          active,
        }),
        {
          loading: active ? "Reactivando..." : "Desactivando...",
          success: () => {
            setMembers((prev) =>
              prev.map((m) => (m.user_id === userId ? { ...m, active } : m)),
            );
            return active ? "Cliente reactivado" : "Cliente desactivado";
          },
          error: (err) =>
            err?.response?.data?.message || err?.message || "Error",
        },
      );
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = members.filter((m) => m.active).length;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
          Catálogo
        </p>
        <h1 className="text-2xl font-normal text-foreground italic flex items-center gap-2">
          <Crown size={20} className="text-amber-500" /> Clientes Premium
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {activeCount} cliente{activeCount !== 1 ? "s" : ""} con acceso activo
        </p>
      </div>

      {/* Buscador para agregar */}
      <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium flex items-center gap-1.5">
          <UserPlus size={12} /> Agregar cliente
        </p>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {search.trim().length >= 2 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground text-sm gap-2">
                <Loader2 size={14} className="animate-spin" /> Buscando...
              </div>
            ) : candidates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No se encontraron clientes.
              </p>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.user_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border">
                    <Image
                      src={c.image || logoAdmin}
                      alt={c.name || c.email}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail size={10} /> {c.email}
                    </p>
                  </div>
                  {c.is_premium ? (
                    <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Ya es Premium
                    </Badge>
                  ) : (
                    <button
                      onClick={() => addMember(c.user_id)}
                      disabled={addingId === c.user_id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-60"
                    >
                      {addingId === c.user_id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Agregar"
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lista de miembros */}
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium">
          Miembros
        </p>

        {loadingMembers ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Loader2 size={14} className="animate-spin" /> Cargando...
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aún no tienes clientes Premium. Búscalos arriba para agregarlos.
          </p>
        ) : (
          <AnimatePresence>
            {members.map((m) => (
              <motion.div
                key={m.membership_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background"
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border">
                  <Image
                    src={m.image || logoAdmin}
                    alt={m.name || m.email}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {m.name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.email}
                  </p>
                </div>
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${
                    m.active
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {m.active ? "Activo" : "Inactivo"}
                </Badge>
                <button
                  onClick={() => toggleActive(m.user_id, !m.active)}
                  disabled={togglingId === m.user_id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-secondary/60 transition-colors disabled:opacity-60"
                  title={m.active ? "Desactivar" : "Reactivar"}
                >
                  {togglingId === m.user_id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

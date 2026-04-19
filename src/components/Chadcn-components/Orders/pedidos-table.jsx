"use client";
import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import apiClient from "@/lib/apiClient";
import {
  Loader2,
  Trash2,
  MoreHorizontal,
  Eye,
  Verified,
  MessageCircle,
  Printer,
  Package,
  Calendar,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ThemeContext } from "@/context/useContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sileo } from "sileo";
import { supabase } from "@/lib/supa";
import { exportToPDF, sendToWhatsApp } from "./pedidos-utils";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 20;

// ─── Botón de acción ──────────────────────────────────────────────────────────
function ActionButton({ onClick, disabled, loading, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center justify-center w-9 h-9 rounded-xl border border-border transition-all duration-200 ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-transparent"
          : "hover:bg-secondary/60 hover:border-primary/30 cursor-pointer bg-transparent"
      }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
      ) : (
        <Icon size={14} className="text-foreground" />
      )}
    </button>
  );
}

// ─── Hook: carga paginada desde EventsSummary ─────────────────────────────────
// Usa la VISTA ligera para la tabla (sin el pedido completo).
// Solo carga el desc completo cuando el admin abre el detalle.
function usePedidos(storeUID) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setPedidos([]);
    setPage(0);
    setHasMore(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Carga paginada desde la vista summary (campos mínimos)
  useEffect(() => {
    if (!storeUID) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("EventsSummary") // ← vista ligera, no la tabla completa
        .select("*")
        .eq("uid", storeUID)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!cancelled && !error && data) {
        setPedidos((prev) => (page === 0 ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [storeUID, page, refreshKey]);

  // Real-time: INSERT y UPDATE de visto llegan automáticamente
  useEffect(() => {
    if (!storeUID) return;

    const channel = supabase
      .channel(`pedidos-${storeUID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Events",
          filter: `uid=eq.${storeUID}`,
        },
        (payload) => {
          // Nuevo pedido: lo añadimos al tope sin recargar todo
          const n = payload.new;
          const nuevo = {
            id: n.id,
            UID_Venta: n.UID_Venta,
            nombre: n.nombre,
            phonenumber: n.phonenumber,
            visto: n.visto,
            created_at: n.created_at,
            updated_at: n.updated_at,
            descripcion: n.descripcion,
            user: n.user,
            // Extraemos campos del desc JSONB directo
            total: n.desc?.total ?? 0,
            moneda: n.desc?.moneda ?? "",
            pago: n.desc?.pago ?? "",
            lugar: n.desc?.lugar ?? "",
            num_productos: n.desc?.pedido?.length ?? 0,
            codigo_descuento: n.desc?.code?.name ?? "",
            descuento_pct: n.desc?.code?.discount ?? 0,
          };
          setPedidos((prev) => [nuevo, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Events",
          filter: `uid=eq.${storeUID}`,
        },
        (payload) => {
          setPedidos((prev) =>
            prev.map((p) =>
              p.UID_Venta === payload.new.UID_Venta
                ? {
                    ...p,
                    visto: payload.new.visto,
                    updated_at: payload.new.updated_at,
                  }
                : p,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "Events",
          filter: `uid=eq.${storeUID}`,
        },
        (payload) => {
          setPedidos((prev) =>
            prev.filter((p) => p.UID_Venta !== payload.old.UID_Venta),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeUID]);

  return {
    pedidos,
    setPedidos,
    loading,
    hasMore,
    loadMore: () => setPage((p) => p + 1),
    refresh,
  };
}

// ─── Tabla de pedidos ─────────────────────────────────────────────────────────
function TablesPedidosBody({
  pedidos,
  sitioweb,
  storeCell,
  storeName,
  verified = false,
  onConfirm,
  onDelete,
  downloading,
}) {
  const router = useRouter();

  if (pedidos.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${verified ? "bg-amber-400" : "bg-emerald-500"}`}
          />
          {verified ? "Pendientes de confirmar" : "Pedidos confirmados"}
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {pedidos.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Cliente",
                  "ID pedido",
                  "Fecha",
                  "Total",
                  "Productos",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {pedidos.map((order, index) => (
                  <motion.tr
                    key={order.UID_Venta}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {(order.nombre || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {order.nombre}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            #{index + 1}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3">
                      <code className="text-xs bg-secondary px-2 py-1 rounded font-mono text-muted-foreground">
                        {order.UID_Venta?.substring(0, 8)}…
                      </code>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar
                          size={12}
                          className="text-primary/60 shrink-0"
                        />
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </div>
                    </td>

                    {/* Total — datos ya extraídos en la vista */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {(order.total || 0).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1">
                        {order.moneda}
                      </span>
                    </td>

                    {/* Productos */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {order.num_productos}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        producto{order.num_productos !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                            {downloading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <MoreHorizontal size={14} />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!order.visto && (
                            <DropdownMenuItem
                              className="gap-2 text-sm"
                              onClick={() => onConfirm([order.UID_Venta])}
                            >
                              <Verified size={14} /> Confirmar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="gap-2 text-sm"
                            onClick={() =>
                              router.push(`/orders/${order.UID_Venta}`)
                            }
                          >
                            <Eye size={14} /> Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-sm"
                            onClick={() => {
                              if (
                                order.phonenumber &&
                                order.phonenumber !== 0
                              ) {
                                window.open(
                                  `https://wa.me/${order.phonenumber}?text=${encodeURIComponent(`Hola, soy de ${storeName}`)}`,
                                  "_blank",
                                );
                              } else {
                                sileo.error({
                                  title: "Sin teléfono",
                                  description:
                                    "El cliente no proporcionó número",
                                });
                              }
                            }}
                          >
                            <MessageCircle size={14} /> Contactar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-sm text-destructive focus:text-destructive"
                            onClick={() => onDelete(order.UID_Venta)}
                          >
                            <Trash2 size={14} /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function PedidosTable() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const storeUID = webshop?.store?.UUID;
  const sitioweb = webshop?.store?.sitioweb;
  const storeCell = webshop?.store?.cell;
  const storeName = webshop?.store?.name;

  const [WhatsApp, setWhatsApp] = useState(false);
  const [loadVerified, setLoadVerified] = useState(false);
  const [PDF, setPDF] = useState(false);

  // Hook con paginación + real-time
  const { pedidos, setPedidos, loading, hasMore, loadMore, refresh } =
    usePedidos(storeUID);

  const noVistos = pedidos.filter((o) => !o.visto);
  const vistos = pedidos.filter((o) => o.visto);
  const busy = loading || WhatsApp || PDF || loadVerified;

  // ── Confirmar pedidos ───────────────────────────────────────────────────
  const confirmarPedidos = useCallback(
    async (uids) => {
      setLoadVerified(true);
      try {
        await apiClient.post(
          `/api/tienda/${sitioweb}/checkOrders`,
          { uids },
          { headers: { "Content-Type": "application/json" } },
        );
        // Actualizar local — el real-time también lo hará, pero así es instantáneo
        setPedidos((prev) =>
          prev.map((p) =>
            uids.includes(p.UID_Venta) ? { ...p, visto: true } : p,
          ),
        );
      } catch (err) {
        sileo.error({ title: "Error al confirmar", description: err?.message });
      } finally {
        setLoadVerified(false);
      }
    },
    [sitioweb, setPedidos],
  );

  // ── Eliminar ────────────────────────────────────────────────────────────
  const eliminarPedido = useCallback(
    async (uid) => {
      try {
        await apiClient.delete(`/api/tienda/${sitioweb}/checkOrders`, {
          data: { uid },
          headers: { "Content-Type": "application/json" },
        });
        setPedidos((prev) => prev.filter((p) => p.UID_Venta !== uid));
      } catch (err) {
        sileo.error({ title: "Error al eliminar", description: err?.message });
      }
    },
    [sitioweb, setPedidos],
  );

  // ── Exportar PDF — necesita cargar los desc completos ──────────────────
  const handleExportToPDF = useCallback(async () => {
    setPDF(true);
    try {
      // Cargamos solo los no vistos con su desc completo para el PDF
      const { data } = await supabase
        .from("Events")
        .select("id, UID_Venta, nombre, created_at, desc")
        .eq("uid", storeUID)
        .eq("visto", false);

      if (data?.length) {
        await confirmarPedidos(data.map((d) => d.UID_Venta));
        await exportToPDF(data.map((d) => ({ ...d, desc: d.desc })));
      }
    } catch (err) {
      sileo.error({ title: "Error al generar PDF", description: err?.message });
    } finally {
      setPDF(false);
    }
  }, [storeUID, confirmarPedidos]);

  // ── WhatsApp — igual, necesita desc completo ───────────────────────────
  const handleWhatsApp = useCallback(async () => {
    setWhatsApp(true);
    try {
      const { data } = await supabase
        .from("Events")
        .select("id, UID_Venta, nombre, created_at, desc")
        .eq("uid", storeUID)
        .eq("visto", false);

      if (data?.length) {
        await confirmarPedidos(data.map((d) => d.UID_Venta));
        await sendToWhatsApp(
          data.map((d) => ({ ...d, desc: d.desc })),
          webshop?.store,
          () => {},
          setWhatsApp,
        );
      }
    } catch (err) {
      sileo.error({ title: "Error WhatsApp", description: err?.message });
    } finally {
      setWhatsApp(false);
    }
  }, [storeUID, confirmarPedidos, webshop?.store]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Gestión
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Pedidos
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Refrescar */}
          <ActionButton
            onClick={refresh}
            disabled={loading}
            loading={loading}
            icon={RefreshCw}
            label="Refrescar"
          />

          {noVistos.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">
                {noVistos.length} sin confirmar
              </span>
              <ActionButton
                onClick={() =>
                  confirmarPedidos(noVistos.map((o) => o.UID_Venta))
                }
                disabled={busy}
                loading={loadVerified}
                icon={Verified}
                label="Confirmar todos"
              />
              <ActionButton
                onClick={handleWhatsApp}
                disabled={busy}
                loading={WhatsApp}
                icon={MessageCircle}
                label="Enviar a WhatsApp"
              />
              <ActionButton
                onClick={handleExportToPDF}
                disabled={busy}
                loading={PDF}
                icon={Printer}
                label="Exportar PDF"
              />
            </>
          )}
        </div>
      </div>

      {/* Tablas */}
      <TablesPedidosBody
        pedidos={noVistos}
        sitioweb={sitioweb}
        storeCell={storeCell}
        storeName={storeName}
        verified
        onConfirm={confirmarPedidos}
        onDelete={eliminarPedido}
        downloading={loadVerified}
      />
      <TablesPedidosBody
        pedidos={vistos}
        sitioweb={sitioweb}
        storeCell={storeCell}
        storeName={storeName}
        onConfirm={confirmarPedidos}
        onDelete={eliminarPedido}
        downloading={false}
      />

      {/* Empty state */}
      {!loading && pedidos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Package size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Sin pedidos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Los nuevos pedidos aparecerán aquí en tiempo real.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cargar más */}
      {hasMore && !loading && pedidos.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="text-sm text-primary hover:underline transition-colors"
          >
            Cargar más pedidos →
          </button>
        </div>
      )}

      {/* Spinner carga inicial */}
      {loading && pedidos.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

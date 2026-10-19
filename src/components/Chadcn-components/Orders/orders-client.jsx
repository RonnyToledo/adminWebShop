"use client";
import React, { useContext, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Trash2,
  ArrowLeft,
  MapPin,
  CreditCard,
  Tag,
  Package,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/lib/apiClient";
import { logoAdmin } from "@/utils/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";

// ─── Helper defensivo para agregados ─────────────────────────────────────────
const safeAgregados = (o) => o?.agregados ?? [];

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
function SummaryCard({ label, value, color = "text-foreground" }) {
  return (
    <div className="bg-secondary/40 rounded-xl border border-border px-4 py-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium mb-1">
        {label}
      </p>
      <p className={`text-xl font-medium tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

// ─── Chip de info ─────────────────────────────────────────────────────────────
function InfoChip({ icon: Icon, label }) {
  if (!label) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-3 py-1">
      <Icon size={11} className="text-primary shrink-0" />
      {label}
    </div>
  );
}

// ─── Fila de producto ─────────────────────────────────────────────────────────
function PlantillaRows({ order, handleAgregadoUpdate }) {
  const subtotalRow =
    (order?.Cant || 0) * ((order?.price || 0) + (order?.embalaje || 0));

  return (
    <TableRow className="hover:bg-secondary/30 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-secondary">
            <Image
              src={order?.image || logoAdmin}
              alt={order?.title || "producto"}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
            {order?.title || "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm tabular-nums">{order?.Cant ?? 0}</TableCell>
      <TableCell className="text-sm tabular-nums text-muted-foreground">
        {(order?.price ?? 0).toLocaleString()}
      </TableCell>
      <TableCell className="text-sm tabular-nums text-muted-foreground">
        {(order?.embalaje ?? 0).toLocaleString()}
      </TableCell>
      <TableCell className="text-sm tabular-nums text-muted-foreground">
        {(order?.priceCompra ?? 0).toLocaleString()}
      </TableCell>
      <TableCell className="text-sm tabular-nums font-medium">
        {subtotalRow.toLocaleString()}
      </TableCell>
      <TableCell>
        <button
          onClick={handleAgregadoUpdate}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </TableCell>
    </TableRow>
  );
}

// ─── Hook: carga el pedido completo desde Supabase ───────────────────────────
//
// PedidosTable usa la vista ligera `EventsSummary` (sin el campo `desc`),
// por lo que el contexto nunca tiene los productos del pedido.
// Este hook va directo a la tabla `Events` para obtener el desc completo.
//
function usePedidoDetalle(specific, initialData) {
  const [dataPedido, setDataPedido] = useState(initialData?.order ?? null);
  const [loading, setLoading] = useState(!initialData?.order);
  const [error, setError] = useState(null);

  const fetchPedido = useCallback(async () => {
    if (!specific) return;
    setLoading(true);
    setError(null);

    const { data, error: sbError } = await supabase
      .from("Events")
      .select("*")
      .eq("UID_Venta", specific)
      .single();

    if (sbError || !data) {
      setError(sbError?.message ?? "Pedido no encontrado");
      setLoading(false);
      return;
    }

    setDataPedido(data);
    setLoading(false);
  }, [specific]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);
  return { dataPedido, setDataPedido, loading, error, refetch: fetchPedido };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PedidoDetalle({ ThemeContext, specific, initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const router = useRouter();

  // Siempre cargamos desde Supabase para tener el desc completo con los productos.
  // No usamos webshop.events porque PedidosTable solo guarda la vista ligera.
  const { dataPedido, setDataPedido, loading, error } = usePedidoDetalle(
    specific,
    initialData,
  );

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);

  // ── Redirigir si el pedido queda sin items ────────────────────────────────
  useEffect(() => {
    if (!dataPedido?.UID_Venta) return;
    const total = dataPedido?.desc?.total;
    if (total === 0) {
      router.push("/orders");
    }
  }, [dataPedido?.desc?.pedido, dataPedido?.UID_Venta, router]);

  // ── Actualizar en servidor ────────────────────────────────────────────────
  async function Update(value) {
    // Actualización optimista local
    setDataPedido(value);

    toast.promise(
      updateDesc(webshop?.store?.sitioweb, value, setWebshop, () => {}),
      {
        loading: "Actualizando pedido...",
        success: () => {
          router.refresh();
          return "Pedido actualizado correctamente";
        },
        error: (err) => (
          "Error",
          {
            description: err?.message ?? "Error al actualizar",
          }
        ),
      },
    );
  }

  // ── Reducir cantidad de un producto / agregado ────────────────────────────
  const handleAgregadoUpdate = (pedido, name) => {
    const valueAux = {
      ...dataPedido,
      desc: {
        ...dataPedido?.desc,
        pedido: (dataPedido?.desc?.pedido ?? []).map((obj) => {
          if (pedido.productId !== obj.productId) return obj;
          if (name) {
            return {
              ...obj,
              agregados: safeAgregados(obj).map((ag) =>
                ag.name === name ? { ...ag, cant: (ag.cant || 0) - 1 } : ag,
              ),
            };
          }
          return { ...obj, Cant: (obj.Cant || 0) - 1 };
        }),
      },
    };
    Update(valueAux);
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const phone = dataPedido?.phonenumber;
    if (phone && phone !== 0) {
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(
          `Hola, soy de ${webshop?.store?.name ?? "la tienda"}`,
        )}`,
        "_blank",
      );
    } else {
      toast.error("Sin teléfono", {
        description: "El cliente no proporcionó número",
      });
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground italic">
            Cargando pedido...
          </span>
        </div>
      </div>
    );
  }

  // ── Error / Not found ─────────────────────────────────────────────────────
  if (error || !dataPedido) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Package size={32} className="text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {error ?? "No se encontró el pedido"}
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="text-xs text-primary hover:underline"
          >
            ← Volver a pedidos
          </button>
        </div>
      </div>
    );
  }

  // ── Cálculos de resumen ───────────────────────────────────────────────────
  const pedido = dataPedido?.desc?.pedido ?? [];
  const discount = dataPedido?.desc?.code?.discount ?? 0;

  const totalItems = pedido.reduce(
    (sum, o) =>
      sum +
      (o?.Cant || 0) +
      safeAgregados(o).reduce((s, ag) => s + (ag?.cant || 0), 0),
    0,
  );

  const subtotal = pedido.reduce(
    (sum, o) =>
      sum +
      (o?.Cant || 0) * ((o?.price || 0) + (o?.embalaje || 0)) +
      safeAgregados(o).reduce(
        (s, ag) =>
          s + (ag?.cant || 0) * ((ag?.price || 0) + (o?.embalaje || 0)),
        0,
      ),
    0,
  );

  const totalFinal = (subtotal * (100 - discount)) / 100;

  const inversion = pedido.reduce(
    (sum, o) =>
      sum +
      (o?.Cant || 0) * (o?.priceCompra || 0) +
      safeAgregados(o).reduce(
        (s, ag) => s + (ag?.cant || 0) * (o?.priceCompra || 0),
        0,
      ),
    0,
  );

  const gananciaBase = pedido.reduce(
    (sum, o) =>
      sum +
      (o?.Cant || 0) *
        ((o?.price || 0) - (o?.priceCompra || 0) - (o?.embalaje || 0)) +
      safeAgregados(o).reduce(
        (s, ag) =>
          s +
          (ag?.cant || 0) *
            ((ag?.price || 0) - (o?.priceCompra || 0) - (o?.embalaje || 0)),
        0,
      ),
    0,
  );
  const ganancia = (gananciaBase * (100 - discount)) / 100;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft size={12} /> Volver a pedidos
          </button>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Detalle de pedido
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Pedido de {dataPedido?.nombre || "—"}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleWhatsApp}
            title="Contactar por WhatsApp"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200"
          >
            <MessageCircle size={14} className="text-foreground" />
          </button>
          <code className="text-xs font-mono bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground border border-border shrink-0">
            {dataPedido?.UID_Venta?.substring(0, 12)}...
          </code>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        <InfoChip icon={MapPin} label={dataPedido?.desc?.lugar} />
        <InfoChip
          icon={CreditCard}
          label={
            dataPedido?.desc?.pago === "cash"
              ? "Efectivo"
              : dataPedido?.desc?.pago === "transfer"
                ? "Transferencia"
                : dataPedido?.desc?.pago
          }
        />
        {dataPedido?.desc?.code?.name && (
          <InfoChip
            icon={Tag}
            label={`${dataPedido.desc.code.name} · ${dataPedido.desc.code.discount}%`}
          />
        )}
        <InfoChip icon={MapPin} label={dataPedido?.desc?.direccion} />
      </div>

      {/* Tabla de productos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Productos del pedido
          </CardTitle>
          {dataPedido?.descripcion && (
            <CardDescription>{dataPedido.descripcion}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-xs">Producto</TableHead>
                <TableHead className="text-xs">Cant.</TableHead>
                <TableHead className="text-xs">Precio</TableHead>
                <TableHead className="text-xs">Embalaje</TableHead>
                <TableHead className="text-xs">Inv.</TableHead>
                <TableHead className="text-xs">Total</TableHead>
                <TableHead className="text-xs w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.map((order) => (
                <React.Fragment key={order.id ?? order.productId}>
                  {(order?.Cant || 0) > 0 && (
                    <PlantillaRows
                      order={order}
                      handleAgregadoUpdate={() =>
                        handleAgregadoUpdate(order, false)
                      }
                    />
                  )}
                  {safeAgregados(order).map((agregado, idx) =>
                    (agregado?.cant || 0) > 0 ? (
                      <PlantillaRows
                        key={`${order.id ?? order.productId}-ag-${idx}`}
                        order={{
                          ...agregado,
                          title: `${order.title} + ${agregado.name}`,
                          price: agregado.price ?? 0,
                          priceCompra: agregado.priceCompra ?? 0,
                          Cant: agregado.cant ?? 0,
                          embalaje: order.embalaje ?? 0,
                          image: agregado.image || order.image || logoAdmin,
                          id: `${order.id ?? order.productId}-agregado-${idx}`,
                        }}
                        handleAgregadoUpdate={() =>
                          handleAgregadoUpdate(order, agregado.name)
                        }
                      />
                    ) : null,
                  )}
                </React.Fragment>
              ))}

              {pedido.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No hay productos en este pedido
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Productos" value={totalItems} />
        <SummaryCard
          label="Total"
          value={totalFinal.toLocaleString()}
          color="text-primary"
        />
        <SummaryCard
          label="Inversión"
          value={inversion.toLocaleString()}
          color="text-green-500"
        />
        <SummaryCard
          label="Ganancia"
          value={ganancia.toLocaleString()}
          color="text-emerald-600"
        />
      </div>
    </div>
  );
}

// ─── updateDesc ───────────────────────────────────────────────────────────────
const updateDesc = async (sitioweb, Event, setWebshop, setState) => {
  setState(true);
  try {
    const response = await apiClient.put(
      `/api/tienda/${sitioweb}/checkOrders`,
      Event,
      { headers: { "Content-Type": "application/json" } },
    );
    if (response.status === 200) {
      setWebshop((prev) => ({
        ...prev,
        events: (prev.events ?? []).map((obj) =>
          obj.UID_Venta === Event.UID_Venta ? Event : obj,
        ),
      }));
    }
  } catch (error) {
    console.error("Error al conectar con la API:", error.message);
    throw error;
  } finally {
    setState(false);
  }
};

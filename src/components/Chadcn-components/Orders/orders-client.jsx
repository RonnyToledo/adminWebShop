"use client";
import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import {
  Trash2,
  ArrowLeft,
  MapPin,
  CreditCard,
  Tag,
  Package,
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
import axios from "axios";
import { logoApp } from "@/utils/image";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const initialState = {
  id: 1742,
  uid: "ad65c9e9-292f-48d2-a64b-941782270896",
  desc: {
    envio: "delivery",
    pago: "transfer",
    pedido: [
      {
        id: 601,
        Cant: 1,
        caja: "d050e6dd-a417-4000-9059-43aad254f0bc",
        span: false,
        image: logoApp,
        order: 6,
        price: 1200,
        priceCompra: 0,
        title: "",
        coment: { promedio: 0, total: 0 },
        creado: "2025-03-01T14:12:15",
        stock: 1,
        storeId: "ad65c9e9-292f-48d2-a64b-941782270896",
        visible: true,
        visitas: 0,
        favorito: false,
        oldPrice: 0,
        agregados: [],
        productId: "412109d3-6b1a-4277-a748-dac7720e33ac",
        descripcion: "",
      },
    ],
    total: 1420,
    provincia: "Ciego de Ávila",
    municipio: "Morón",
    code: { discount: 0, name: "" },
    people: "Yily",
  },
  visto: false,
  events: "compra",
  nombre: "Yily",
  UID_Venta: "0f7993ee-c95f-42a8-8935-a10d44dd2b88",
  created_at: "2025-07-12T10:14:38-04:00",
};

// ─── Resumen metric ───────────────────────────────────────────────────────────
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

// ─── Fila de producto ─────────────────────────────────────────────────────────
function PlantillaRows({ order, handleAgregadoUpdate }) {
  return (
    <TableRow className="hover:bg-secondary/30 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-secondary">
            <Image
              src={order?.image || logoApp}
              alt={order?.title || ""}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
            {order?.title || "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm tabular-nums">{order?.Cant || 0}</TableCell>
      <TableCell className="text-sm tabular-nums text-muted-foreground">
        {(order?.price || 0).toLocaleString()}
      </TableCell>
      <TableCell className="text-sm tabular-nums text-muted-foreground">
        {order?.embalaje || 0}
      </TableCell>
      <TableCell className="text-sm tabular-nums text-muted-foreground">
        {(order?.priceCompra || 0).toLocaleString()}
      </TableCell>
      <TableCell className="text-sm tabular-nums font-medium">
        {(
          (order.Cant || 0) *
          ((order.price || 0) + (order.embalaje || 0))
        ).toLocaleString()}
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PedidoDetalle({ ThemeContext, specific }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [dataPedido, setDataPedido] = useState(initialState);
  const router = useRouter();
  useEffect(() => {
    setDataPedido(
      (webshop?.events || []).find((obj) => obj.UID_Venta === specific),
    );
  }, [specific, webshop?.events]);

  useEffect(() => {
    const total = (dataPedido?.desc?.pedido ?? []).reduce(
      (sum, order) =>
        sum +
        (order?.Cant || 0) +
        (order?.agregados ?? []).reduce((s, ag) => s + (ag?.cant || 0), 0),
      0,
    );
    if (total === 0) {
      setWebshop((prev) => ({
        ...prev,
        events: prev.events.filter((obj) => obj.UID_Venta !== specific),
      }));
      router.push("/orders");
    }
  }, [dataPedido?.desc?.pedido, router]);

  async function Update(value) {
    sileo.promise(
      updateDesc(webshop?.store.sitioweb, value, setWebshop, () => {}),
      {
        loading: { title: "Actualizando pedido..." },
        success: () => ({ title: "Pedido actualizado correctamente" }),
        error: (err) => ({
          title: "Error",
          description: err?.message ?? "Error al actualizar",
        }),
      },
    );
  }

  const handleAgregadoUpdate = (pedido, name) => {
    const valueAux = {
      ...dataPedido,
      desc: {
        ...dataPedido?.desc,
        pedido: dataPedido?.desc?.pedido.map((obj) => {
          if (pedido.productId !== obj.productId) return obj;
          if (name) {
            return {
              ...obj,
              agregados: obj.agregados.map((ag) =>
                ag.name === name ? { ...ag, cant: ag.cant - 1 } : ag,
              ),
            };
          }
          return { ...obj, Cant: obj.Cant - 1 };
        }),
      },
    };
    Update(valueAux);
  };

  // Loading / not found
  if (!webshop?.events) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="inline-block w-4 h-4 rounded-full border-2 border-border border-t-primary"
            style={{ display: "block" }}
          />
          <span className="text-sm text-muted-foreground italic">
            Cargando pedido...
          </span>
        </div>
      </div>
    );
  }

  if (!dataPedido) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Package size={32} className="text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            No se encontró el pedido
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

  // Cálculos de resumen
  const totalItems = dataPedido?.desc?.pedido.reduce(
    (sum, o) =>
      sum +
      (o.Cant || 0) +
      o.agregados.reduce((s, ag) => s + (ag.cant || 0), 0),
    0,
  );
  const discount = dataPedido?.desc?.code?.discount || 0;
  const subtotal = dataPedido?.desc?.pedido.reduce(
    (sum, o) =>
      sum +
      o.Cant * ((o.embalaje || 0) + o.price || 0) +
      o.agregados.reduce(
        (s, ag) =>
          s + ((ag.cant || 0) * (ag.price || 0 + (o.embalaje || 0)) || 0),
        0,
      ),
    0,
  );
  const totalFinal = (subtotal * (100 - discount)) / 100;
  const inversion = dataPedido?.desc?.pedido.reduce(
    (sum, o) =>
      sum +
      (o.Cant * (o.priceCompra || 0) || 0) +
      o.agregados.reduce(
        (s, ag) => s + ((ag.cant || 0) * (o.priceCompra || 0) || 0),
        0,
      ),
    0,
  );
  const ganancia =
    (dataPedido?.desc?.pedido.reduce(
      (sum, o) =>
        sum +
        o.Cant * (o.price - ((o.embalaje || 0) + o.priceCompra || 0) || 0) +
        o.agregados.reduce(
          (s, ag) =>
            s +
            ((ag.cant || 0) *
              (ag.price - ((o.priceCompra || 0) + (o.embalaje || 0)) || 0) ||
              0),
          0,
        ),
      0,
    ) *
      (100 - discount)) /
    100;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
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
        <code className="text-xs font-mono bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground border border-border shrink-0">
          {dataPedido?.UID_Venta?.substring(0, 12)}...
        </code>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        {dataPedido?.desc?.lugar && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-3 py-1">
            <MapPin size={11} className="text-primary" />
            {dataPedido.desc.lugar}
          </div>
        )}
        {dataPedido?.desc?.pago && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-3 py-1">
            <CreditCard size={11} className="text-primary" />
            {dataPedido.desc.pago === "cash" ? "Efectivo" : "Transferencia"}
          </div>
        )}
        {dataPedido?.desc?.code?.name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-3 py-1">
            <Tag size={11} className="text-primary" />
            {dataPedido.desc.code.name} · {dataPedido.desc.code.discount}%
          </div>
        )}
        {dataPedido?.desc?.direccion && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-3 py-1">
            <MapPin size={11} /> {dataPedido.desc.direccion}
          </div>
        )}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Productos del pedido
          </CardTitle>
          {dataPedido?.desc?.descripcion && (
            <CardDescription>{dataPedido.desc.descripcion}</CardDescription>
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
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dataPedido?.desc?.pedido || []).map((order) => (
                <React.Fragment key={order.id}>
                  {order.Cant > 0 && (
                    <PlantillaRows
                      order={order}
                      handleAgregadoUpdate={() =>
                        handleAgregadoUpdate(order, false)
                      }
                    />
                  )}
                  {order.agregados?.map((agregado, idx) =>
                    agregado.cant > 0 ? (
                      <PlantillaRows
                        key={`${order.id}-ag-${idx}`}
                        order={{
                          ...agregado,
                          title: `${order.title} + ${agregado.name}`,
                          price: agregado.price || 0,
                          priceCompra: agregado.priceCompra || 0,
                          Cant: agregado.cant ?? 0,
                          image: agregado.image || order.image || logoApp,
                          id: `${order.id}-agregado-${idx}`,
                        }}
                        handleAgregadoUpdate={() =>
                          handleAgregadoUpdate(order, agregado.name)
                        }
                      />
                    ) : null,
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumen */}
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
          color="text-amber-500"
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

// ─── updateDesc sin cambios ───────────────────────────────────────────────────
const updateDesc = async (sitioweb, Event, setWebshop, setState) => {
  setState(true);
  try {
    const response = await axios.put(
      `/api/tienda/${sitioweb}/checkOrders`,
      Event,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    if (response.status === 200) {
      setWebshop((prev) => ({
        ...prev,
        events: prev.events.map((obj) =>
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

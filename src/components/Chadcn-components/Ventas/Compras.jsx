"use client";
import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  CreditCard,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  Tag,
  Clock,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supa";
import PlanGuard from "../Planes/PlanGuard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCUP(n = 0) {
  return Number(n).toLocaleString("es-CU") + " CUP";
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `Hace ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.round(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.round(diff / 86400)} días`;
  return new Date(dateStr).toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
  });
}

// Suma de campo total
function sumTotal(compras) {
  return compras.reduce((s, c) => s + (c.total ?? 0), 0);
}

// Total productos vendidos (sum de Cant en pedidos)
function sumProductosVendidos(compras) {
  return compras.reduce(
    (s, c) => s + (c.pedido ?? []).reduce((ps, p) => ps + (p.Cant ?? 1), 0),
    0,
  );
}

// Total últimas 24h
function totalUltimas24h(compras) {
  const hace24 = Date.now() - 86400000;
  return compras
    .filter((c) => new Date(c.created_at).getTime() >= hace24)
    .reduce((s, c) => s + (c.total ?? 0), 0);
}

// Ticket promedio
function ticketPromedio(compras) {
  if (!compras.length) return 0;
  return sumTotal(compras) / compras.length;
}

// Últimos N meses para el gráfico de área
function comprasPorMes(compras, n = 7) {
  const hoy = new Date();
  const mapa = {};
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mapa[key] = 0;
  }
  compras.forEach((c) => {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in mapa) mapa[key] += c.total ?? 0;
  });
  return Object.entries(mapa).map(([key, suma]) => {
    const [y, m] = key.split("-");
    const mes = new Date(+y, +m - 1).toLocaleString("es-ES", {
      month: "short",
      year: "2-digit",
    });
    return { mes, suma };
  });
}

// Productos más vendidos (top N)
function topProductos(compras, n = 5) {
  const mapa = {};
  compras.forEach((c) => {
    (c.pedido ?? []).forEach((p) => {
      if (!mapa[p.title]) mapa[p.title] = { title: p.title, cant: 0, total: 0 };
      mapa[p.title].cant += p.Cant ?? 1;
      mapa[p.title].total += (p.price ?? 0) * (p.Cant ?? 1);
    });
  });
  return Object.values(mapa)
    .sort((a, b) => b.cant - a.cant)
    .slice(0, n);
}

// Desglose por método de pago
function desglosePago(compras) {
  const mapa = {};
  compras.forEach((c) => {
    const k = c.pago ?? "cash";
    if (!mapa[k]) mapa[k] = { metodo: k, total: 0, count: 0 };
    mapa[k].total += c.total ?? 0;
    mapa[k].count += 1;
  });
  return Object.values(mapa);
}

// Desglose por lugar de entrega
function desgloseEntrega(compras) {
  const mapa = {};
  compras.forEach((c) => {
    const k = c.lugar ?? "Local";
    if (!mapa[k]) mapa[k] = { lugar: k, count: 0 };
    mapa[k].count += 1;
  });
  return Object.values(mapa);
}

// Variación porcentual entre el último mes y el anterior
function variacionMensual(compras) {
  const meses = comprasPorMes(compras, 2);
  const [ant, act] = meses.map((m) => m.suma);
  if (!ant) return null;
  return Math.round(((act - ant) / ant) * 100);
}

// Últimas N compras para tabla
function ultimasCompras(compras, n = 8) {
  return [...compras]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, n);
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function StatCard({ title, value, description, icon, trend }) {
  const isPos = trend > 0;
  const isNeg = trend < 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend != null && (
            <>
              {isPos && <TrendingUp className="w-3 h-3 text-green-500" />}
              {isNeg && <TrendingDown className="w-3 h-3 text-red-500" />}
              <span
                className={`text-xs font-medium ${isPos ? "text-green-500" : isNeg ? "text-red-500" : "text-muted-foreground"}`}
              >
                {isPos && "+"}
                {trend}%
              </span>
            </>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Tabla de últimas ventas
function TablaVentas({ compras }) {
  const rows = ultimasCompras(compras);
  const PAGO_LABEL = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
  };
  const LUGAR_LABEL = {
    Local: "Local",
    domicilio: "Domicilio",
    pickup: "Recogida",
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Últimas ventas</CardTitle>
        <CardDescription>
          {compras.length} pedido{compras.length !== 1 ? "s" : ""} en total
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Sin ventas registradas
                  </TableCell>
                </TableRow>
              )}
              {rows.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {(c.people ?? "?")[0].toUpperCase()}
                      </div>
                      {c.people ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {(c.pedido ?? [])
                        .map((p) => `${p.title} ×${p.Cant ?? 1}`)
                        .join(", ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {PAGO_LABEL[c.pago] ?? c.pago ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {LUGAR_LABEL[c.lugar] ?? c.lugar ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCUP(c.total)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {timeAgo(c.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Top productos vendidos
function TopProductos({ compras }) {
  const top = topProductos(compras);
  const maxC = top[0]?.cant ?? 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos más vendidos</CardTitle>
        <CardDescription>Por cantidad de unidades</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin datos</p>
        )}
        {top.map((p, i) => (
          <div key={p.title} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate flex-1">{p.title}</span>
              <span className="text-muted-foreground ml-2">
                {p.cant} ud · {formatCUP(p.total)}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.round((p.cant / maxC) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Desglose pago / entrega
function DesgloseCards({ compras }) {
  const pagos = desglosePago(compras);
  const entregas = desgloseEntrega(compras);
  const PAGO_LABEL = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
  };
  const LUGAR_LABEL = {
    Local: "Local",
    domicilio: "Domicilio",
    pickup: "Recogida",
  };
  const total = compras.length || 1;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Métodos de pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pagos.map((p) => (
            <div
              key={p.metodo}
              className="flex items-center justify-between text-sm"
            >
              <span>{PAGO_LABEL[p.metodo] ?? p.metodo}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{p.count} pedidos</span>
                <Badge variant="outline">
                  {Math.round((p.count / total) * 100)}%
                </Badge>
              </div>
            </div>
          ))}
          {pagos.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tipo de entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entregas.map((e) => (
            <div
              key={e.lugar}
              className="flex items-center justify-between text-sm"
            >
              <span>{LUGAR_LABEL[e.lugar] ?? e.lugar}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{e.count} pedidos</span>
                <Badge variant="outline">
                  {Math.round((e.count / total) * 100)}%
                </Badge>
              </div>
            </div>
          ))}
          {entregas.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Dialog de búsqueda por UID_Venta
function BuscarPedidoDialog({ compras }) {
  const [busqueda, setBusqueda] = useState("");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Busca primero en los datos locales, luego en Supabase
  async function buscar() {
    if (!busqueda.trim()) return;
    setLoading(true);

    // 1. Buscar localmente
    const local = compras.find((c) => c.UID_Venta === busqueda.trim());
    if (local) {
      setEvent(local);
      setLoading(false);
      return;
    }

    // 2. Si no está local, consultar Supabase
    const { data } = await supabase
      .from("Events")
      .select("*")
      .eq("UID_Venta", busqueda.trim());
    if (data?.length) {
      const desc =
        typeof data[0].desc === "string"
          ? JSON.parse(data[0].desc)
          : data[0].desc;
      setEvent({ ...desc, created_at: data[0].created_at });
    } else {
      setEvent(null);
    }
    setLoading(false);
  }

  const PAGO_LABEL = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          Buscar pedido
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar pedido por ID</DialogTitle>
          <DialogDescription>Ingresa el UID_Venta del pedido</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <Input
            placeholder="UID_Venta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            className="flex-1"
          />
          <Button onClick={buscar} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {event === null && busqueda && !loading && (
          <p className="text-sm text-muted-foreground mt-2">
            No se encontró el pedido.
          </p>
        )}

        {event && (
          <div className="mt-4 space-y-4">
            {/* Encabezado del pedido */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                {event.people ?? "—"}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {event.created_at ? timeAgo(event.created_at) : "—"}
              </div>
              <Badge variant="outline">
                {PAGO_LABEL[event.pago] ?? event.pago ?? "—"}
              </Badge>
              <Badge variant="secondary">{event.lugar ?? "—"}</Badge>
              {event.code?.name && (
                <Badge variant="secondary" className="font-mono">
                  {event.code.name}
                  {event.code.discount > 0 && ` −${event.code.discount}%`}
                </Badge>
              )}
            </div>

            {/* Tabla de productos */}
            <ScrollArea className="max-h-64 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Precio u.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(event.pedido ?? [])
                    .filter((p) => (p.Cant ?? 1) > 0)
                    .map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{p.Cant ?? 1}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCUP(p.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCUP((p.price ?? 0) * (p.Cant ?? 1))}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                  {(event.shipping ?? 0) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Envío
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCUP(event.shipping)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCUP(event.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const chartConfig = {
  suma: { label: "Total (CUP)", color: "var(--chart-1)" },
};

export default function VentasDashboard({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);

  const [compras, setCompras] = useState([]);

  useEffect(() => {
    const raw = (webshop?.events ?? [])
      .filter((e) => e.events === "compra")
      .map((e) => ({
        ...e.desc,
        created_at: e.created_at,
        UID_Venta: e.UID_Venta,
      }));
    setCompras(raw);
  }, [webshop]);

  const totalVentas = sumTotal(compras);
  const totalPedidos = compras.length;
  const totalProductos = sumProductosVendidos(compras);
  const ventas24h = totalUltimas24h(compras);
  const ticket = ticketPromedio(compras);
  const variacion = variacionMensual(compras);
  const graficoDatos = useMemo(() => comprasPorMes(compras), [compras]);

  return (
    <PlanGuard feature="analitycs">
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Ventas</h1>
              <p className="text-sm text-muted-foreground">
                {webshop?.store?.name ?? "Tienda"} · {webshop?.store?.Provincia}
              </p>
            </div>
            <BuscarPedidoDialog compras={compras} />
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Ingresos totales"
              value={formatCUP(totalVentas)}
              description="acumulado"
              trend={variacion}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Pedidos"
              value={totalPedidos}
              description="realizados"
              icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Productos vendidos"
              value={totalProductos}
              description="unidades totales"
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Ticket promedio"
              value={formatCUP(Math.round(ticket))}
              description="por pedido"
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Últimas 24 h"
              value={formatCUP(ventas24h)}
              description="recaudado hoy"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          {/* Gráfico + Top productos */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Balance mensual</CardTitle>
                <CardDescription>
                  Ingresos en CUP — últimos 7 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart data={graficoDatos} margin={{ left: 0, right: 8 }}>
                    <defs>
                      <linearGradient
                        id="colorSuma"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="mes"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      dataKey="suma"
                      type="monotone"
                      fill="url(#colorSuma)"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--chart-1)" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {variacion != null ? (
                  <span
                    className={
                      variacion >= 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion)}% vs mes
                    anterior
                  </span>
                ) : (
                  <span>Sin datos comparativos</span>
                )}
              </CardFooter>
            </Card>

            <TopProductos compras={compras} />
          </div>

          {/* Tabla últimas ventas */}
          <div className="grid gap-4 lg:grid-cols-3">
            <TablaVentas compras={compras} />
            <DesgloseCards compras={compras} />
          </div>
        </main>
      </div>
    </PlanGuard>
  );
}

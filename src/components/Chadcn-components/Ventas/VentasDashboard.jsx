"use client";
import { useContext, useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { calcularGranosClientes } from "@/utils/granos";
import { TablaGranos } from "./TablaGranos";
import PlanGuard from "../Planes/PlanGuard";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logs } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n = 0, currency = "CUP") {
  return Number(n).toLocaleString("es-CU") + " " + currency;
}

function fmtK(n = 0) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.round(diff / 60)} min`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h`;
  if (diff < 604800) return `${Math.round(diff / 86400)} d`;
  return new Date(dateStr).toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
  });
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function getMonthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1).toLocaleString("es-ES", {
    month: "short",
    year: "2-digit",
  });
}

// ─── Data processors ──────────────────────────────────────────────────────────

function processCompras(events = []) {
  return events
    .filter((e) => e.events === "compra")
    .map((e) => ({
      ...e.desc,
      total: Number(e.desc?.total ?? 0),
      moneda: e.desc?.moneda || "CUP",
      created_at: e.created_at,
      UID_Venta: e.UID_Venta,
    }));
}

function buildMonthlyData(compras, n = 7) {
  const hoy = new Date();
  const mapa = {};
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    mapa[key] = { mes: getMonthLabel(key), ingresos: 0, pedidos: 0 };
  }
  compras.forEach((c) => {
    const key = getMonthKey(c.created_at);
    if (mapa[key]) {
      mapa[key].ingresos += c.total ?? 0;
      mapa[key].pedidos++;
    }
  });
  return Object.values(mapa);
}

function buildAfiliados(compras) {
  const mapa = {};
  compras.forEach((c) => {
    const k = c.code?.name || "(directo)";
    if (!mapa[k]) mapa[k] = { code: k, ingresos: 0, ventas: 0 };
    mapa[k].ingresos += c.total ?? 0;
    mapa[k].ventas++;
  });
  return Object.values(mapa)
    .map((a) => ({ ...a, ticketPromedio: Math.round(a.ingresos / a.ventas) }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

function buildProductos(compras, n = 6) {
  const mapa = {};
  compras.forEach((c) =>
    (c.pedido ?? []).forEach((p) => {
      if (!mapa[p.title]) mapa[p.title] = { title: p.title, cant: 0, total: 0 };
      mapa[p.title].cant += p.Cant ?? 1;
      mapa[p.title].total += (p.price ?? 0) * (p.Cant ?? 1);
    }),
  );
  return Object.values(mapa)
    .sort((a, b) => b.cant - a.cant)
    .slice(0, n);
}

function buildCodigos(compras, codeDiscountArr = []) {
  const visitas = Object.fromEntries(
    codeDiscountArr.map((c) => [c.code, c.visitas ?? 0]),
  );
  const mapa = {};
  compras.forEach((c) => {
    const k = c.code?.name;
    if (!k) return;
    if (!mapa[k]) mapa[k] = { code: k, ingresos: 0, ventas: 0 };
    mapa[k].ingresos += c.total ?? 0;
    mapa[k].ventas++;
  });
  return Object.values(mapa)
    .map((c) => ({
      ...c,
      visitas: visitas[c.code] ?? 0,
      conversion: visitas[c.code]
        ? ((c.ventas / visitas[c.code]) * 100).toFixed(1)
        : null,
    }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

function buildPagos(compras) {
  const labels = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
  };
  const mapa = {};
  compras.forEach((c) => {
    const k = labels[c.pago] ?? c.pago ?? "otro";
    if (!mapa[k]) mapa[k] = { name: k, value: 0 };
    mapa[k].value++;
  });
  return Object.values(mapa);
}

function buildEntregas(compras) {
  const labels = { Local: "Local", place: "Domicilio", pickup: "Recogida" };
  const mapa = {};
  compras.forEach((c) => {
    const k = labels[c.lugar] ?? c.lugar ?? "otro";
    if (!mapa[k]) mapa[k] = { name: k, value: 0 };
    mapa[k].value++;
  });
  return Object.values(mapa);
}

function buildAlerts(compras, monthlyData, afiliados, currency) {
  if (compras.length === 0) {
    return [
      {
        type: "info",
        msg: `Aún no hay pedidos en ${currency} para analizar.`,
      },
    ];
  }

  const alerts = [];
  const last = monthlyData[monthlyData.length - 1]?.ingresos ?? 0;
  const prev = monthlyData[monthlyData.length - 2]?.ingresos ?? 0;
  const growth = prev ? Math.round(((last - prev) / prev) * 100) : 0;

  if (growth < -20)
    alerts.push({
      type: "danger",
      msg: `Caída de ingresos del ${Math.abs(growth)}% vs el mes anterior. Revisar estrategia.`,
    });
  if (growth > 20)
    alerts.push({
      type: "success",
      msg: `Crecimiento del ${growth}% este mes. Excelente rendimiento.`,
    });

  const domPct = compras.length
    ? Math.round(
        (compras.filter((c) => c.lugar === "place").length / compras.length) *
          100,
      )
    : 0;
  if (domPct > 60)
    alerts.push({
      type: "info",
      msg: `${domPct}% de pedidos son a domicilio. Considera optimizar costos de envío.`,
    });

  const noCode = compras.filter((c) => !c.code?.name).length;
  if (noCode > 2)
    alerts.push({
      type: "warning",
      msg: `${noCode} ventas sin código de seguimiento. Los afiliados no reciben crédito.`,
    });

  const top = afiliados[0];
  if (top && compras.length && top.ventas / compras.length > 0.4)
    alerts.push({
      type: "warning",
      msg: `El código ${top.code} concentra más del ${Math.round((top.ventas / compras.length) * 100)}% de ventas. Alta dependencia.`,
    });

  if (alerts.length === 0)
    alerts.push({
      type: "success",
      msg: "Sin alertas críticas. El negocio opera dentro de parámetros normales.",
    });

  return alerts;
}

// ─── Small components ─────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase mt-6 mb-3">
      {children}
    </p>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        active
          ? "bg-muted text-foreground border-border"
          : "bg-transparent text-muted-foreground border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden my-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── Feature components ───────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend }) {
  const isPos = trend > 0;
  const isNeg = trend < 0;
  return (
    <div className="bg-muted rounded-lg p-3 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-medium text-foreground leading-tight">
        {value}
      </span>
      <div className="flex items-center gap-1 text-xs flex-wrap">
        {trend != null && (
          <span
            className={
              isPos
                ? "text-green-600"
                : isNeg
                  ? "text-red-500"
                  : "text-muted-foreground"
            }
          >
            {isPos ? "↑" : isNeg ? "↓" : "—"} {Math.abs(trend)}%
          </span>
        )}
        <span className="text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

const AFF_COLORS = [
  "#378ADD",
  "#1D9E75",
  "#D85A30",
  "#7F77DD",
  "#888780",
  "#BA7517",
];

function AfiliadoRow({ a, max, index, currency }) {
  const pct = max ? Math.round((a.ingresos / max) * 100) : 0;
  const color = AFF_COLORS[index % AFF_COLORS.length];
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
        style={{ background: color + "22", color }}
      >
        {a.code.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium truncate max-w-[120px]">
            {a.code}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {fmtK(a.ingresos)} {currency}
          </span>
        </div>
        <ProgressBar pct={pct} color={color} />
        <p className="text-[11px] text-muted-foreground">
          {a.ventas} venta{a.ventas > 1 ? "s" : ""} · ticket{" "}
          {fmt(a.ticketPromedio, currency)}
        </p>
      </div>
    </div>
  );
}

function CodigoRow({ c, currency }) {
  const isEff = c.conversion !== null && parseFloat(c.conversion) > 3;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-xs font-medium">{c.code}</p>
        <p className="text-[11px] text-muted-foreground">
          {c.visitas > 0 ? `${c.visitas} visitas · ` : ""}
          {c.ventas} venta{c.ventas > 1 ? "s" : ""}
        </p>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <p className="text-xs font-medium">
          {fmtK(c.ingresos)} {currency}
        </p>
        {c.conversion !== null && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isEff ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
          >
            {c.conversion}% conv.
          </span>
        )}
      </div>
    </div>
  );
}

function ProductoRow({ p, max, currency }) {
  const pct = max ? Math.round((p.cant / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs truncate max-w-[200px]">{p.title}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
          {p.cant} ud
        </span>
      </div>
      <ProgressBar pct={pct} color="#1D9E75" />
      <p className="text-[11px] text-muted-foreground">
        {fmt(p.total, currency)}
      </p>
    </div>
  );
}

const ALERT_STYLES = {
  success: "bg-green-50 text-green-800 border-l-green-500",
  warning: "bg-amber-50 text-amber-800 border-l-amber-500",
  danger: "bg-red-50 text-red-800 border-l-red-500",
  info: "bg-blue-50 text-blue-800 border-l-blue-500",
};
const ALERT_ICONS = { success: "✓", warning: "⚠", danger: "⚠", info: "i" };

function AlertBanner({ type, msg }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-4 py-2.5 text-sm border-l-4 ${ALERT_STYLES[type] ?? ALERT_STYLES.info}`}
    >
      <span className="shrink-0 font-semibold mt-px">{ALERT_ICONS[type]}</span>
      <span>{msg}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label, isIngresos, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          {isIngresos ? fmt(p.value, currency) : `${p.value} pedidos`}
        </div>
      ))}
    </div>
  );
}

const PAGO_LABEL = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};
const LUGAR_LABEL = { Local: "Local", place: "Domicilio", pickup: "Recogida" };

function TxTable({ compras, currency }) {
  const [filter, setFilter] = useState("all");
  const rows = [...compras]
    .filter((c) => filter === "all" || c.lugar === filter)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <Card>
      <CardHeader
        title="Historial de transacciones"
        sub={`${rows.length} transacciones · ${currency}`}
        right={
          <div className="flex gap-1.5 flex-wrap">
            {[
              ["all", "Todos"],
              ["Local", "Local"],
              ["place", "Domicilio"],
            ].map(([v, l]) => (
              <FilterBtn
                key={v}
                active={filter === v}
                onClick={() => setFilter(v)}
              >
                {l}
              </FilterBtn>
            ))}
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {[
                "Cliente",
                "Productos",
                "Pago",
                "Entrega",
                "Total",
                "Fecha",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`text-[11px] font-medium text-muted-foreground pb-2 border-b border-border whitespace-nowrap px-2 ${i >= 4 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-muted-foreground py-8 text-sm"
                >
                  Sin resultados
                </td>
              </tr>
            ) : (
              rows.map((c, i) => (
                <tr
                  key={c.UID_Venta ?? i}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="py-2 px-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                        {(c.people ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium leading-tight">
                          {c.people ?? "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.phonenumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 border-b border-border max-w-[180px]">
                    <div className="flex flex-wrap gap-1">
                      {(c.pedido ?? []).map((p, pi) => (
                        <span
                          key={pi}
                          className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 whitespace-nowrap max-w-[130px] truncate inline-block"
                        >
                          {p.title.split(" ").slice(0, 3).join(" ")} ×
                          {p.Cant ?? 1}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2 border-b border-border">
                    <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {PAGO_LABEL[c.pago] ?? c.pago ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 px-2 border-b border-border">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${c.lugar === "Local" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {LUGAR_LABEL[c.lugar] ?? c.lugar ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 px-2 border-b border-border text-right">
                    <span className="text-xs font-medium whitespace-nowrap">
                      {fmt(c.total, currency)}
                    </span>
                  </td>
                  <td className="py-2 px-2 border-b border-border text-right">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(c.created_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VentasDashboard({ ThemeContext, initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [chartMode, setChartMode] = useState("ingresos");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [clientes, setClientes] = useState([]);
  const [compras, setCompras] = useState(() =>
    processCompras(initialData?.events ?? []),
  );
  const router = useRouter();

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);
  useEffect(() => {
    const events = initialData?.events ?? webshop?.events ?? [];
    const raw = processCompras(events);
    setCompras(raw);
    setClientes(calcularGranosClientes(events));
  }, [initialData?.events, webshop?.events]);

  const currencyOptions = useMemo(
    () => [...new Set(compras.map((purchase) => purchase.moneda))].sort(),
    [compras],
  );
  const defaultCurrency =
    webshop?.store?.monedas?.find((currency) => currency.defecto)?.nombre ??
    webshop?.store?.monedas?.[0]?.nombre ??
    "CUP";
  const currency = currencyOptions.includes(currencyFilter)
    ? currencyFilter
    : currencyOptions.includes(defaultCurrency)
      ? defaultCurrency
      : (currencyOptions[0] ?? defaultCurrency);
  const filteredPurchases = useMemo(
    () => compras.filter((purchase) => purchase.moneda === currency),
    [compras, currency],
  );

  const monthly = useMemo(
    () => buildMonthlyData(filteredPurchases),
    [filteredPurchases],
  );
  const afiliados = useMemo(
    () => buildAfiliados(filteredPurchases),
    [filteredPurchases],
  );
  const productos = useMemo(
    () => buildProductos(filteredPurchases),
    [filteredPurchases],
  );
  const codigos = useMemo(
    () => buildCodigos(filteredPurchases, webshop?.code ?? []),
    [filteredPurchases, webshop?.code],
  );
  const pagos = useMemo(() => buildPagos(filteredPurchases), [filteredPurchases]);
  const entregas = useMemo(
    () => buildEntregas(filteredPurchases),
    [filteredPurchases],
  );
  const alerts = useMemo(
    () => buildAlerts(filteredPurchases, monthly, afiliados, currency),
    [filteredPurchases, monthly, afiliados, currency],
  );

  const totalVentas = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.total,
    0,
  );
  const totalPedidos = filteredPurchases.length;
  const ticket = totalPedidos ? Math.round(totalVentas / totalPedidos) : 0;
  const totalVisitas = webshop?.ga?.cant ?? 0;
  const conv = totalVisitas
    ? ((totalPedidos / totalVisitas) * 100).toFixed(1)
    : "0.0";
  const hace24 = filteredPurchases
    .filter((c) => Date.now() - new Date(c.created_at).getTime() < 86400000)
    .reduce((sum, purchase) => sum + purchase.total, 0);

  const lastMonth = monthly[monthly.length - 1]?.ingresos ?? 0;
  const prevMonth = monthly[monthly.length - 2]?.ingresos ?? 0;
  const growth = prevMonth
    ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100)
    : null;

  const maxAff = afiliados[0]?.ingresos ?? 1;
  const maxProd = productos[0]?.cant ?? 1;
  const chartColor = chartMode === "ingresos" ? "#378ADD" : "#1D9E75";

  const funnelData = [
    {
      label: "Visitas totales",
      value: totalVisitas,
      color: "#E6F1FB",
      text: "#185FA5",
    },
    {
      label: "Últimos 30 días",
      value: webshop?.ga?.filterDatesInLast30Days ?? 0,
      color: "#EAF3DE",
      text: "#3B6D11",
    },
    {
      label: "Pedidos totales",
      value: totalPedidos,
      color: "#FAEEDA",
      text: "#854F0B",
    },
    {
      label: "Conversión",
      value: conv + "%",
      color: "#EEEDFE",
      text: "#534AB7",
    },
  ];

  return (
    <PlanGuard feature="analitycs">
      <div className="flex flex-col min-h-screen p-4 md:p-6 bg-background">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Panel financiero
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {webshop?.store?.name ?? "Tienda"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currencyOptions.length > 1 ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Moneda
                <select
                  aria-label="Filtrar ventas por moneda"
                  value={currency}
                  onChange={(event) => setCurrencyFilter(event.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
                >
                  {currencyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="text-xs text-muted-foreground">{currency}</span>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                Actualizado al abrir
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            onClick={() => router.push("/orders")}
          >
            <Logs size={12} className="text-gray-400" />
            Ver pedidos
          </Button>
        </div>

        {/* KPIs */}
        <SectionLabel>Visión general</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <KpiCard
            label="Ingresos totales"
            value={fmt(totalVentas, currency)}
            sub={`en ${currency}`}
            trend={null}
          />
          <KpiCard
            label="Crecimiento"
            value={
              growth != null
                ? (growth >= 0 ? "+" : "") + growth + "%"
                : "—"
            }
            sub={`vs mes anterior · ${currency}`}
            trend={growth}
          />
          <KpiCard
            label="Pedidos"
            value={totalPedidos}
            sub="transacciones"
            trend={null}
          />
          <KpiCard
            label="Ticket promedio"
            value={fmt(ticket, currency)}
            sub="por pedido"
            trend={null}
          />
          <KpiCard
            label="Conversión"
            value={conv + "%"}
            sub="visitas → compra"
            trend={null}
          />
          <KpiCard
            label="Últimas 24h"
            value={fmt(hace24, currency)}
            sub={`últimas 24 h · ${currency}`}
            trend={null}
          />
        </div>

        {/* Gráfico */}
        <SectionLabel>Tendencia de ingresos</SectionLabel>
        <Card>
          <CardHeader
            title="Ingresos por mes"
            sub="Últimos 7 meses"
            right={
              <div className="flex gap-1.5">
                {[
                  ["ingresos", "Ingresos"],
                  ["pedidos", "Pedidos"],
                ].map(([v, l]) => (
                  <FilterBtn
                    key={v}
                    active={chartMode === v}
                    onClick={() => setChartMode(v)}
                  >
                    {l}
                  </FilterBtn>
                ))}
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={monthly}
              margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(128,128,128,.1)"
              />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  chartMode === "ingresos"
                    ? v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v
                    : v
                }
              />
              <Tooltip
                content={
                  <CustomTooltip
                    isIngresos={chartMode === "ingresos"}
                    currency={currency}
                  />
                }
              />
              <Area
                dataKey={chartMode}
                type="monotone"
                fill="url(#chartGrad)"
                stroke={chartColor}
                strokeWidth={2}
                dot={{ r: 3, fill: chartColor }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p
            className={`text-xs mt-2 ${growth != null && growth >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {growth != null ? (
              `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% vs mes anterior`
            ) : (
              <span className="text-muted-foreground">
                Sin datos comparativos
              </span>
            )}
          </p>
        </Card>

        {/* Afiliados + Códigos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Card>
            <CardHeader
              title="Rendimiento de afiliados"
              sub="Top por ingresos generados"
            />
            {afiliados.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sin datos</p>
            ) : (
              afiliados.map((a, i) => (
                <AfiliadoRow
                  key={a.code}
                  a={a}
                  max={maxAff}
                  index={i}
                  currency={currency}
                />
              ))
            )}
          </Card>
          <Card>
            <CardHeader
              title="Análisis de códigos"
              sub="Efectividad y conversión"
            />
            {codigos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sin datos</p>
            ) : (
              codigos.map((c) =>               <CodigoRow key={c.code} c={c} currency={currency} />)
            )}
          </Card>
        </div>

        {/* Productos + Funnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Card>
            <CardHeader
              title="Productos estrella"
              sub="Por unidades vendidas"
            />
            {productos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sin datos</p>
            ) : (
              productos.map((p) => (
                <ProductoRow
                  key={p.title}
                  p={p}
                  max={maxProd}
                  currency={currency}
                />
              ))
            )}
          </Card>
          <Card>
            <CardHeader title="Funnel de conversión" sub="Visitas → ventas" />
            {funnelData.map((f) => (
              <div key={f.label} className="flex items-center gap-3 mb-3">
                <span className="text-xs text-muted-foreground min-w-[100px] shrink-0">
                  {f.label}
                </span>
                <div
                  className="flex-1 h-8 rounded flex items-center px-3"
                  style={{ background: f.color }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: f.text }}
                  >
                    {typeof f.value === "number"
                      ? f.value.toLocaleString("es-CU")
                      : f.value}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Segmentación */}
        <SectionLabel>Segmentación</SectionLabel>
        <Card>
          <p className="text-sm font-medium mb-4">Distribución de ventas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Por tipo de entrega
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={entregas}
                  margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="rgba(128,128,128,.1)"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name="Pedidos"
                    fill="#7F77DD"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        <SectionLabel>Inteligencia de negocio</SectionLabel>
        <div className="flex flex-col gap-2">
          {alerts.map((a, i) => (
            <AlertBanner key={i} {...a} />
          ))}
        </div>

        {/* Tabla */}
        <SectionLabel>Registro 10 ultimas operaciones</SectionLabel>
        <TxTable compras={filteredPurchases.slice(0, 10)} currency={currency} />

        {/* Granos */}
        {clientes.length > 0 && (
          <>
            <SectionLabel>Programa de fidelización</SectionLabel>
            <TablaGranos clientes={clientes} />
          </>
        )}
      </div>
    </PlanGuard>
  );
}

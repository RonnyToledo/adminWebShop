"use client";

import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Monitor,
  MousePointer2,
  Smartphone,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ORANGE = "#E8611A";
const ORANGE_LIGHT = "#F28B48";
const ORANGE_SOFT = "#FDBA74";

export default function Page({ ThemeContext, initialData }) {
  /*
   * ==========================================================
   * MISMO FLUJO QUE LOGINS
   * ==========================================================
   */

  const { webshop, setWebshop } = useContext(ThemeContext);

  const [logins, setLogins] = useState({
    filterDatesInLast30Days: 0,
    countEntriesInLast7Days: [],
    countEntriesInLast90Days: [],
    contarVisitasPorHora: [],
    calcularPromedioVisitasPorDia: {
      visitasPorDia: {},
      promedio: 0,
    },
    promedioVisitasPorMes: {
      porMes: [],
      promedio: 0,
    },
    cant: 0,
    visitasProductos: {},
    visitasBlog: {},
    usuarios: {
      activos: 0,
      nuevos: 0,
    },
    duracionPromedioSesionSeg: 0,
    tasaRebote: 0,
    visitasPorDispositivo: {},
    visitasPorCanal: {},
  });

  /*
   * ==========================================================
   * INITIAL DATA -> WEBSHOP
   * ==========================================================
   */

  useEffect(() => {
    if (!initialData) return;

    setWebshop((previous) => ({
      ...previous,
      ...initialData,

      store: {
        ...previous?.store,
        ...(initialData.store ?? {}),
      },
    }));
  }, [initialData, setWebshop]);

  /*
   * ==========================================================
   * WEBSHOP.GA -> LOGINS
   * ==========================================================
   */

  useEffect(() => {
    if (webshop?.ga) {
      setLogins(webshop.ga);
    }
  }, [webshop?.ga]);

  /*
   * ==========================================================
   * RANGO
   * ==========================================================
   */

  const [range, setRange] = useState("Últimos 30 días");

  /*
   * ==========================================================
   * FECHA
   * ==========================================================
   */

  const parseDateOnlyAsLocal = (dateString) => {
    const [y, m, d] = String(dateString).split("-").map(Number);

    return new Date(y, m - 1, d);
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";

    return parseDateOnlyAsLocal(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  }, []);

  const formatMonth = (clave) => {
    if (!clave) return "";

    const [year, month] = String(clave).split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString("es-ES", {
      month: "short",
    });
  };

  /*
   * ==========================================================
   * ACTIVIDAD DIARIA
   * ==========================================================
   */

  const dailyData = useMemo(() => {
    return (logins.countEntriesInLast90Days ?? []).map((item) => ({
      date: formatDate(item.date),
      rawDate: item.date,
      value: Number(item.count) || 0,
    }));
  }, [formatDate, logins.countEntriesInLast90Days]);

  const visibleDaily = useMemo(() => {
    if (range === "Últimos 7 días") {
      return dailyData.slice(-7);
    }

    if (range === "Últimos 90 días") {
      return dailyData;
    }

    return dailyData.slice(-30);
  }, [range, dailyData]);

  /*
   * ==========================================================
   * TOTALES
   * ==========================================================
   */

  const totalVisits90Days = useMemo(() => {
    return (logins.countEntriesInLast90Days ?? []).reduce(
      (sum, day) => sum + (Number(day.count) || 0),
      0,
    );
  }, [logins.countEntriesInLast90Days]);

  const activeDays90Days = useMemo(() => {
    return (logins.countEntriesInLast90Days ?? []).filter(
      (day) => Number(day.count) > 0,
    ).length;
  }, [logins.countEntriesInLast90Days]);

  const activeDaysLast7 = useMemo(() => {
    return (logins.countEntriesInLast7Days ?? []).filter(
      (day) => Number(day.count) > 0,
    ).length;
  }, [logins.countEntriesInLast7Days]);

  /*
   * ==========================================================
   * HORAS
   * ==========================================================
   */

  const hourlyData = useMemo(() => {
    return (logins.contarVisitasPorHora ?? []).map((item) => ({
      hour: item.hora,
      value: Number(item.cantidad) || 0,
    }));
  }, [logins.contarVisitasPorHora]);

  const peakHour = useMemo(() => {
    if (!hourlyData.length) {
      return null;
    }

    return hourlyData.reduce((max, item) =>
      item.value > max.value ? item : max,
    );
  }, [hourlyData]);

  /*
   * ==========================================================
   * MESES
   * ==========================================================
   */

  const months = useMemo(() => {
    return (logins.promedioVisitasPorMes?.porMes ?? []).map((item) => ({
      month: formatMonth(item.clave),
      visits: Number(item.sessions) || 0,
    }));
  }, [logins.promedioVisitasPorMes]);

  /*
   * ==========================================================
   * PRODUCTOS
   * ==========================================================
   */

  const products = useMemo(() => {
    return Object.entries(logins.visitasProductos ?? {})
      .map(([name, visits]) => ({
        name: name.replaceAll("_", " "),
        visits: Number(visits) || 0,
      }))
      .sort((a, b) => b.visits - a.visits);
  }, [logins.visitasProductos]);

  /*
   * ==========================================================
   * CANALES
   * ==========================================================
   */

  const channels = useMemo(() => {
    const channelStyles = ["#1A0A00", ORANGE, ORANGE_LIGHT, ORANGE_SOFT];

    return Object.entries(logins.visitasPorCanal ?? {})
      .map(([name, value], index) => ({
        name:
          name === "Direct"
            ? "Acceso por Link"
            : name === "Organic Search"
              ? "Búsqueda en Internet"
              : name,

        value: Number(value) || 0,

        color: channelStyles[index % channelStyles.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [logins.visitasPorCanal]);

  /*
   * ==========================================================
   * DISPOSITIVOS
   * ==========================================================
   */

  const devices = useMemo(() => {
    return {
      mobile: Number(logins.visitasPorDispositivo?.mobile) || 0,

      desktop: Number(logins.visitasPorDispositivo?.desktop) || 0,
    };
  }, [logins.visitasPorDispositivo]);

  const totalDevices = devices.mobile + devices.desktop;

  const mobilePercentage =
    totalDevices > 0 ? (devices.mobile / totalDevices) * 100 : 0;

  const desktopPercentage =
    totalDevices > 0 ? (devices.desktop / totalDevices) * 100 : 0;

  /*
   * ==========================================================
   * COMPARATIVA
   * ==========================================================
   */

  const periodComparison = useMemo(() => {
    const data = logins.countEntriesInLast90Days ?? [];

    const currentData = data.slice(-30);

    const previousData = data.slice(-60, -30);

    const current = currentData.reduce(
      (sum, item) => sum + (Number(item.count) || 0),
      0,
    );

    const previous = previousData.reduce(
      (sum, item) => sum + (Number(item.count) || 0),
      0,
    );

    const variation =
      previous > 0 ? ((current - previous) / previous) * 100 : null;

    return {
      current,
      previous,
      variation,
    };
  }, [logins.countEntriesInLast90Days]);

  /*
   * ==========================================================
   * VALORES
   * ==========================================================
   */

  const visitsLast30Days = Number(logins.filterDatesInLast30Days) || 0;

  const monthlyAverage = Number(logins.promedioVisitasPorMes?.promedio) || 0;

  const dailyAverage =
    Number(logins.calcularPromedioVisitasPorDia?.promedio) || 0;

  const totalVisits = Number(logins.cant) || totalVisits90Days;

  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
            Analytics / Resumen
          </p>

          <h1 className="text-2xl font-normal tracking-tight text-foreground">
            Actividad de tu tienda
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Entiende cómo interactúan tus clientes con tu sitio web.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted sm:self-auto"
        >
          <CalendarDays size={15} />

          {dailyData.length
            ? dailyData[dailyData.length - 1].date
            : "Sin datos"}

          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </header>

      {/* ====================================================
          KPI
      ==================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* VISITAS 30 */}

        <div className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Visitas este mes
            </p>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <MousePointer2 size={16} strokeWidth={1.8} />
            </span>
          </div>

          <p className="mt-3 text-2xl font-medium tabular-nums text-foreground">
            {visitsLast30Days}
          </p>

          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>últimos 30 días</span>

            {periodComparison.variation !== null && (
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  periodComparison.variation >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {periodComparison.variation >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {Math.abs(periodComparison.variation).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* PROMEDIO */}

        <div className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Promedio mensual
            </p>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <TrendingUp size={16} strokeWidth={1.8} />
            </span>
          </div>

          <p className="mt-3 text-2xl font-medium tabular-nums text-foreground">
            {monthlyAverage.toFixed(1)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">visitas / mes</p>
        </div>

        {/* TOTAL */}

        <div className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Total visitas
            </p>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <BarChart3 size={16} strokeWidth={1.8} />
            </span>
          </div>

          <p className="mt-3 text-2xl font-medium tabular-nums text-foreground">
            {totalVisits}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">histórico</p>
        </div>

        {/* DÍAS */}

        <div // KPI
          className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Días con actividad
            </p>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Clock3 size={16} strokeWidth={1.8} />
            </span>
          </div>

          <p className="mt-3 text-2xl font-medium tabular-nums text-foreground">
            {activeDaysLast7}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">últimos 7 días</p>
        </div>
      </div>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ==================================================
            ACTIVIDAD
        ================================================== */}

        <section className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                Tráfico
              </p>

              <h2 className="mt-1 text-base font-medium text-foreground">
                Actividad reciente
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Visitas durante los últimos 90 días
              </p>
            </div>

            <div className="relative">
              <select
                aria-label="Seleccionar periodo"
                value={range}
                onChange={(event) => setRange(event.target.value)}
                // Select activo
                className="h-9 appearance-none rounded-lg border border-orange-200 bg-orange-50/40 py-0 pl-3 pr-9 text-xs text-foreground outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-orange-950 dark:bg-orange-950/20"
              >
                <option>Últimos 30 días</option>

                <option>Últimos 7 días</option>

                <option>Últimos 90 días</option>
              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>

          <div className="h-[280px] w-full p-4 sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visibleDaily}
                margin={{
                  top: 12,
                  right: 4,
                  left: -25,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="visitsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.28} />

                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke={ORANGE_LIGHT}
                  strokeOpacity={0.2}
                  strokeDasharray="3 4"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: ORANGE,
                    fontSize: 10,
                  }}
                  interval={
                    range === "Últimos 7 días"
                      ? 0
                      : Math.max(1, Math.floor(visibleDaily.length / 7))
                  }
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: ORANGE,
                    fontSize: 10,
                  }}
                  allowDecimals={false}
                  domain={[0, "dataMax + 1"]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${ORANGE_SOFT}`,
                    background: ORANGE_LIGHT,
                    boxShadow: "0 10px 30px rgb(0 0 0 / 0.08)",
                    fontSize: 12,
                  }}
                  formatter={(value) => [value, "Visitas"]}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={ORANGE}
                  strokeWidth={2.5}
                  fill="url(#visitsGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: ORANGE,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-600" />
              {totalVisits90Days} visitas registradas
            </span>

            <span>Promedio diario: {dailyAverage.toFixed(2)}</span>
          </div>
        </section>

        {/* ==================================================
            PROMEDIO
        ================================================== */}

        <section // KPI
          className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
            Comparativa
          </p>

          <h2 className="mt-1 text-base font-medium text-foreground">
            Promedio de uso
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Visitas agrupadas por mes
          </p>

          <div className="mt-5">
            <span className="text-3xl font-medium tracking-tight text-foreground">
              {monthlyAverage.toFixed(2)}
            </span>

            <span className="ml-1 text-xs text-muted-foreground">
              visitas / mes
            </span>
          </div>

          <div className="mt-4 h-[105px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={months}
                margin={{
                  top: 8,
                  right: 2,
                  left: -27,
                  bottom: 0,
                }}
              >
                <YAxis hide domain={[0, "dataMax + 5"]} />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: ORANGE_SOFT,
                    fontSize: 10,
                  }}
                />

                <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                  {months.map((entry, index) => (
                    <Cell
                      key={`${entry.month}-${index}`}
                      fill={index === months.length - 1 ? ORANGE : ORANGE_SOFT}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">
                Periodo actual
              </span>

              <strong className="text-xl font-medium text-foreground">
                {periodComparison.current}
              </strong>

              <span className="text-[11px] text-muted-foreground">visitas</span>
            </div>

            {periodComparison.variation !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  periodComparison.variation >= 0
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                {periodComparison.variation >= 0 ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {Math.abs(periodComparison.variation).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">
                Periodo anterior
              </span>

              <strong className="text-xl font-medium text-foreground">
                {periodComparison.previous}
              </strong>

              <span className="text-[11px] text-muted-foreground">visitas</span>
            </div>

            <span className="text-[11px] text-muted-foreground">
              30 días anteriores
            </span>
          </div>
        </section>
      </div>

      {/* ====================================================
          HORARIOS
      ==================================================== */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
              Patrones de uso
            </p>

            <h2 className="mt-1 flex items-center gap-2 text-base font-medium text-foreground">
              <Clock3
                size={17}
                className="text-orange-600 dark:text-orange-400"
              />
              Horarios de mayor actividad
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Distribución de visitas por hora del día (00:00 — 23:00)
            </p>
          </div>

          {peakHour && (
            <span className="inline-flex w-fit items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 dark:border-orange-950 dark:bg-orange-950/30 dark:text-orange-400">
              Pico: {peakHour.hour} · {peakHour.value}{" "}
              {peakHour.value === 1 ? "visita" : "visitas"}
            </span>
          )}
        </div>

        <div className="h-[220px] w-full p-4 sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hourlyData}
              margin={{
                top: 12,
                right: 4,
                left: -25,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity={0.34} />

                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeDasharray="3 4"
              />

              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 9,
                }}
                interval={1}
              />

              <YAxis hide domain={[0, "dataMax + 2"]} />

              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  fontSize: 12,
                }}
                formatter={(value) => [value, "Visitas"]}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={ORANGE}
                strokeWidth={2.5}
                fill="url(#hourGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ====================================================
          BOTTOM
      ==================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ==================================================
            HEATMAP
        ================================================== */}

        <section // KPI
          className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
            Actividad diaria
          </p>

          <h2 className="mt-1 text-base font-medium text-foreground">
            Uso del sitio web
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Actividad durante los últimos 90 días
          </p>

          <div className="mt-5 grid grid-cols-12 gap-1.5">
            {(logins.countEntriesInLast90Days ?? []).map((day, index) => (
              <span
                key={`${day.date}-${index}`}
                title={`${day.date}: ${day.count || 0} visitas`}
                className={[
                  "aspect-square w-full rounded-[3px] transition-opacity hover:opacity-70",
                  Number(day.count) === 0 && "bg-muted",
                  Number(day.count) === 1 &&
                    "bg-orange-100 dark:bg-orange-950/50",
                  Number(day.count) === 2 &&
                    "bg-orange-200 dark:bg-orange-900/60",
                  Number(day.count) === 3 &&
                    "bg-orange-300 dark:bg-orange-800/70",
                  Number(day.count) === 4 && "bg-orange-500 dark:bg-orange-700",
                  Number(day.count) >= 5 && "bg-orange-600 dark:bg-orange-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
            <span>Menos</span>

            <span className="h-3 w-3 rounded-[2px] bg-muted" />
            <span className="h-3 w-3 rounded-[2px] bg-orange-100 dark:bg-orange-950/50" />
            <span className="h-3 w-3 rounded-[2px] bg-orange-200 dark:bg-orange-900/60" />
            <span className="h-3 w-3 rounded-[2px] bg-orange-300 dark:bg-orange-800/70" />
            <span className="h-3 w-3 rounded-[2px] bg-orange-500 dark:bg-orange-700" />
            <span className="h-3 w-3 rounded-[2px] bg-orange-600 dark:bg-orange-500" />

            <span>Más</span>
          </div>

          <div className="mt-5 grid grid-cols-2 divide-x divide-border border-t border-border pt-4">
            <div>
              <p className="text-[11px] text-muted-foreground">
                Total de visitas
              </p>

              <p className="mt-1 text-2xl font-medium tabular-nums text-foreground">
                {totalVisits90Days}
              </p>
            </div>

            <div className="pl-5">
              <p className="text-[11px] text-muted-foreground">Días activos</p>

              <p className="mt-1 text-2xl font-medium tabular-nums text-foreground">
                {activeDays90Days}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            PRODUCTOS
        ================================================== */}

        <section // KPI
          className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <TrendingUp size={17} />
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground">
                Productos más visitados
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Rendimiento por producto
              </p>
            </div>
          </div>

          <div className="mt-4">
            {products.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Sin datos de productos
              </div>
            ) : (
              products.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center justify-between border-b border-border py-3 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`w-5 shrink-0 font-mono text-[11px] ${
                        index === 0
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="truncate text-sm text-foreground">
                      {product.name}
                    </span>
                  </div>

                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                    <strong className="font-medium text-foreground">
                      {product.visits}
                    </strong>{" "}
                    vis.
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ==================================================
            AUDIENCIA
        ================================================== */}

        <section // KPI
          className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background p-4 shadow-sm dark:border-orange-950/60 dark:from-orange-950/20"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
            Audiencia
          </p>

          <h2 className="mt-1 text-base font-medium text-foreground">
            Quién te visita
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Dispositivos y canales de adquisición
          </p>

          {/* DISPOSITIVOS */}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Smartphone size={14} />
                Mobile
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <strong className="text-xl font-medium text-foreground">
                  {devices.mobile}
                </strong>

                <span className="text-[10px] text-muted-foreground">
                  {mobilePercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Monitor size={14} />
                Desktop
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <strong className="text-xl font-medium text-foreground">
                  {devices.desktop}
                </strong>

                <span className="text-[10px] text-muted-foreground">
                  {desktopPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* DONUT */}

          <div className="mt-5 flex items-center justify-center gap-5">
            <div className="h-[130px] w-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channels}
                    innerRadius={43}
                    outerRadius={59}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {channels.map((channel, index) => (
                      <Cell
                        key={`${channel.name}-${index}`}
                        fill={channel.color}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col">
              <strong className="text-2xl font-medium tabular-nums text-foreground">
                {channels.reduce((sum, channel) => sum + channel.value, 0)}
              </strong>

              <span className="max-w-20 text-xs leading-4 text-muted-foreground">
                visitas con canal
              </span>
            </div>
          </div>

          {/* CANALES */}

          <div className="mt-4 space-y-2">
            {channels.map((channel, index) => (
              <div
                key={`${channel.name}-${index}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      index === 0
                        ? "bg-foreground"
                        : index === 1
                          ? "bg-orange-600 dark:bg-orange-500"
                          : "bg-muted-foreground"
                    }`}
                  />

                  <span className="truncate">{channel.name}</span>
                </span>

                <strong className="ml-3 font-medium tabular-nums text-foreground">
                  {channel.value}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Datos actualizados desde la API
        </span>

        <span>Fuente: API de analítica</span>
      </footer>
    </main>
  );
}

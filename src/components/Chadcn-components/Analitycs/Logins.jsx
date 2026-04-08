"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Clock, Eye, BarChart2, ShoppingBag } from "lucide-react";
import UsageChart from "./usage-chart";
import PlanGuard from "../Planes/PlanGuard";

const chartConfig = {
  views: { label: "Visitas" },
  count: { label: "Cantidad", color: "hsl(var(--chart-1))" },
};

function parseDateOnlyAsLocal(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const obtenerMejoresYPeoresProductos = (productos) => {
  const ahora = new Date();
  const conVisitas = productos
    .map((p) => {
      const dias = (ahora - new Date(p.creado)) / (1000 * 60 * 60 * 24);
      if (dias > 7) return { ...p, visitasPorDia: p.visitas / dias };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.visitasPorDia - a.visitasPorDia);
  return { mejores: conVisitas.slice(0, 3), peores: conVisitas.slice(-3) };
};

// ─── Metric card simple ───────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-secondary/40 rounded-xl border border-border px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium mb-1">
          {label}
        </p>
        <p className="text-2xl font-medium text-foreground tabular-nums">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-primary" />
        </div>
      )}
    </div>
  );
}

// ─── Producto row ─────────────────────────────────────────────────────────────
function ProductRow({ title, visitas, rank, best }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`text-[11px] font-mono w-5 shrink-0 ${best ? "text-primary" : "text-muted-foreground/50"}`}
        >
          {rank}
        </span>
        <span className="text-sm text-foreground truncate">{title}</span>
      </div>
      <span className="text-xs text-muted-foreground ml-4 shrink-0">
        {visitas} vis.
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Logins({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);
  const [logins, setLogins] = useState({
    filterDatesInLast30Days: 0,
    contarVisitasPorHora: [],
    countEntriesInLast7Days: [],
  });

  useEffect(() => {
    if (webshop.ga) setLogins(webshop.ga);
  }, [webshop.ga]);

  const { mejores, peores } = obtenerMejoresYPeoresProductos(
    webshop?.products || [],
  );

  return (
    <PlanGuard feature="analitycs">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Analytics
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Actividad de tu tienda
          </h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Visitas este mes"
            value={logins.filterDatesInLast30Days ?? 0}
            sub="últimos 30 días"
            icon={Eye}
          />
          <MetricCard
            label="Promedio mensual"
            value={logins.promedioVisitasPorMes?.promedio?.toFixed(1) ?? "—"}
            sub="visitas / mes"
            icon={TrendingUp}
          />
          <MetricCard
            label="Total visitas"
            value={logins.cant ?? 0}
            sub="histórico"
            icon={BarChart2}
          />
          <MetricCard
            label="Días con actividad"
            value={
              (logins.countEntriesInLast7Days || []).filter((d) => d.count > 0)
                .length
            }
            sub="últimos 7 días"
            icon={Clock}
          />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Actividad 7 días */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Actividad reciente
              </CardTitle>
              <CardDescription>Visitas en los últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="w-full h-[180px]">
                <BarChart
                  data={logins.countEntriesInLast7Days}
                  margin={{ left: 0, right: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickFormatter={(v) =>
                      parseDateOnlyAsLocal(String(v)).toLocaleDateString(
                        "es-ES",
                        { day: "numeric", month: "short" },
                      )
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-auto"
                        nameKey="views"
                        labelFormatter={(v) =>
                          parseDateOnlyAsLocal(String(v)).toLocaleDateString(
                            "es-ES",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Promedios */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Promedio de uso
              </CardTitle>
              <CardDescription>Comparativa de períodos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-medium tabular-nums text-foreground">
                    {logins.filterDatesInLast30Days ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vis. / últimos 30 días
                  </span>
                </div>
                <ChartContainer
                  config={{
                    steps: { label: "steps", color: "hsl(var(--primary))" },
                  }}
                  className="h-8 w-full"
                >
                  <BarChart
                    layout="vertical"
                    margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                    data={[
                      {
                        date: "Últimos 30 días",
                        steps: logins.filterDatesInLast30Days ?? 0,
                      },
                    ]}
                  >
                    <Bar
                      dataKey="steps"
                      fill="var(--color-steps)"
                      radius={4}
                      barSize={28}
                    >
                      <LabelList
                        position="insideLeft"
                        dataKey="date"
                        offset={8}
                        fontSize={11}
                        fill="white"
                      />
                    </Bar>
                    <YAxis dataKey="date" type="category" hide />
                    <XAxis dataKey="steps" type="number" hide />
                  </BarChart>
                </ChartContainer>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-medium tabular-nums text-foreground">
                    {logins.promedioVisitasPorMes?.promedio?.toFixed(1) ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vis. / mes (historial)
                  </span>
                </div>
                <ChartContainer
                  config={{
                    steps: { label: "steps", color: "hsl(var(--muted))" },
                  }}
                  className="h-8 w-full"
                >
                  <BarChart
                    layout="vertical"
                    margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                    data={[
                      {
                        date: "Últimos 12 meses",
                        steps: logins.promedioVisitasPorMes?.promedio ?? 0,
                      },
                    ]}
                  >
                    <Bar
                      dataKey="steps"
                      fill="var(--color-steps)"
                      radius={4}
                      barSize={28}
                    >
                      <LabelList
                        position="insideLeft"
                        dataKey="date"
                        offset={8}
                        fontSize={11}
                        fill="hsl(var(--muted-foreground))"
                      />
                    </Bar>
                    <YAxis dataKey="date" type="category" hide />
                    <XAxis dataKey="steps" type="number" hide />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitas por hora */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              Horarios de mayor actividad
            </CardTitle>
            <CardDescription>
              Distribución de visitas por hora del día (00:00 – 23:00)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <ChartContainer
              config={{
                cantidad: { label: "Visitas", color: "hsl(var(--primary))" },
              }}
              className="h-[160px] w-full"
            >
              <AreaChart
                data={logins.contarVisitasPorHora}
                margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
              >
                <XAxis
                  dataKey="hora"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis domain={[0, "dataMax + 2"]} hide />
                <defs>
                  <linearGradient id="fillHour" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.03}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="cantidad"
                  type="natural"
                  fill="url(#fillHour)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                  formatter={(value) => (
                    <div className="flex min-w-[100px] items-center text-xs text-muted-foreground">
                      Visitas
                      <span className="ml-auto font-mono font-medium text-foreground">
                        {value}
                      </span>
                    </div>
                  )}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Uso general + productos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <UsageChart />
          </div>

          {/* Mejores productos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingBag size={14} className="text-primary" />
                Más visitados
              </CardTitle>
              <CardDescription>Productos con mayor tráfico</CardDescription>
            </CardHeader>
            <CardContent>
              {mejores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos suficientes aún
                </p>
              ) : (
                mejores.map((p, i) => (
                  <ProductRow
                    key={p.id}
                    title={p.title}
                    visitas={p.visitas}
                    rank={`#${i + 1}`}
                    best
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Peores productos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingBag size={14} className="text-muted-foreground" />
                Menos visitados
              </CardTitle>
              <CardDescription>Productos con menor tráfico</CardDescription>
            </CardHeader>
            <CardContent>
              {peores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos suficientes aún
                </p>
              ) : (
                peores.map((p, i) => (
                  <ProductRow
                    key={p.id}
                    title={p.title}
                    visitas={p.visitas}
                    rank={`#${i + 1}`}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlanGuard>
  );
}

"use client";
import React from "react";
import { useState, useEffect, useContext } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CreditCard } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Label,
  LabelList,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UsageChart from "../usage-chart";
// Llamar a la función para obtener los datos
const chartConfig = {
  views: {
    label: "Page Views",
  },
  count: {
    label: "Counts",
    color: "hsl(var(--chart-1))",
  },
};

export default function Logins({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);
  const [logins, setlogins] = useState({
    filterDatesInLast30Days: 0,
    contarVisitasPorHora: [],
    countEntriesInLast7Days: [],
  });

  useEffect(() => {
    if (webshop.ga) setlogins(webshop.ga);
  }, [webshop.ga]);
  return (
    <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2  lg:grid-cols-1 ">
        <UsageChart />
        <Card className="max-w-xs" x-chunk="charts-01-chunk-2">
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>
                Uso de su web en los ultimos 7 dias
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={chartConfig}
              className="w-full h-[150px] md:h-[200px] lg:h-[300px]"
            >
              <BarChart
                accessibilityLayer
                data={logins.countEntriesInLast7Days}
                width={100}
                margin={{
                  left: 0,
                  right: 0,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-auto"
                      nameKey="views"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Bar dataKey={"count"} fill={`hsl(var(--chart-1))`} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full flex-1 gap-6 lg:max-w-[20rem]">
        <Card className="max-w-xs" x-chunk="charts-01-chunk-2">
          <CardHeader>
            <CardTitle>Promedio de uso mensual</CardTitle>
            <CardDescription>
              Compare que tan productivo ha sido este mes para su negocio
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid auto-rows-min gap-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                {logins?.filterDatesInLast30Days
                  ? logins.filterDatesInLast30Days
                  : 0}
                <span className="text-sm font-normal text-muted-foreground">
                  visitas/mes
                </span>
              </div>
              <ChartContainer
                config={{
                  steps: {
                    label: "steps",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                  }}
                  data={[
                    {
                      date: "Ultimos 30 dias",
                      steps: logins?.filterDatesInLast30Days
                        ? logins.filterDatesInLast30Days
                        : 0,
                    },
                  ]}
                >
                  <Bar
                    dataKey="steps"
                    fill="var(--color-steps)"
                    radius={4}
                    barSize={32}
                  >
                    <LabelList
                      position="insideLeft"
                      dataKey="date"
                      offset={8}
                      fontSize={12}
                      fill="white"
                    />
                  </Bar>
                  <YAxis dataKey="date" type="category" tickCount={1} hide />
                  <XAxis dataKey="steps" type="number" hide />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="grid auto-rows-min gap-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                {logins?.promedioVisitasPorMes?.promedio.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  visitas/mes
                </span>
              </div>
              <ChartContainer
                config={{
                  steps: {
                    label: "Steps",
                    color: "hsl(var(--muted))",
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                  }}
                  data={[
                    {
                      date: "Ultimos 12 meses",
                      steps: logins?.promedioVisitasPorMes?.promedio.toFixed(2),
                    },
                  ]}
                >
                  <Bar
                    dataKey="steps"
                    fill="var(--color-steps)"
                    radius={4}
                    barSize={32}
                  >
                    <LabelList
                      position="insideLeft"
                      dataKey="date"
                      offset={8}
                      fontSize={12}
                      fill="hsl(var(--muted-foreground))"
                    />
                  </Bar>
                  <YAxis dataKey="date" type="category" tickCount={1} hide />
                  <XAxis dataKey="steps" type="number" hide />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="max-w-xs" x-chunk="charts-01-chunk-3">
          <CardHeader className="p-4 pb-0">
            <CardTitle>Cantidad de visitas</CardTitle>
            <CardDescription>
              Total de veces q se ha usado el sitio web por parte de los
              clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-baseline gap-4 p-4 pt-0">
            <div className="flex items-baseline gap-1 text-3xl font-bold tabular-nums leading-none">
              {logins?.cant}
              <span className="text-sm font-normal text-muted-foreground">
                clientes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full flex-1 gap-6">
        <Card className="max-w-xs" x-chunk="charts-01-chunk-7">
          <CardHeader className="space-y-0 pb-0">
            <CardDescription>Horarios de mayor visitas</CardDescription>
            <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
              00:00
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                AM hasta
              </span>
              24:00
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                PM
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={{
                cantidad: {
                  label: "Cantidad",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <AreaChart
                accessibilityLayer
                data={logins?.contarVisitasPorHora}
                margin={{
                  left: 1,
                  right: 1,
                  top: 1,
                  bottom: 1,
                }}
              >
                <XAxis dataKey="hora" />
                <YAxis domain={["0", "dataMax + 5"]} hide />
                <defs>
                  <linearGradient id="fillTime" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-time)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-time)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="cantidad"
                  type="natural"
                  fill="url(#fillTime)"
                  fillOpacity={0.4}
                  stroke="var(--color-time)"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                  formatter={(value) => (
                    <div className="flex min-w-[120px] items-center text-xs text-muted-foreground">
                      Visitas
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {value}
                      </div>
                    </div>
                  )}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos mas visitados
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
              {obtenerMejoresYPeoresProductos(webshop.products).mejores.map(
                (obj, ind) => (
                  <li key={ind} className="flex justify-between items-center">
                    <span>{obj.title}</span>
                    <span>{obj.visitas}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos menos visitados
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
              {obtenerMejoresYPeoresProductos(webshop.products).peores.map(
                (obj, ind) => (
                  <li key={ind} className="flex justify-between items-center">
                    <span>{obj.title}</span>
                    <span>{obj.visitas}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function convertDateToMonthDay(dateString) {
  const parts = dateString.split("-");
  const month = parts[1];
  const day = parts[2];
  return `${month}-${day}`;
}

// Función para calcular visitas por día y obtener los mejores y peores productos
const obtenerMejoresYPeoresProductos = (productos) => {
  const ahora = new Date();

  // Calcular visitas por día solo para productos con más de una semana de creados
  const productosConVisitasPorDia = productos
    .map((producto) => {
      const fechaCreado = new Date(producto.creado);
      const dias = (ahora - fechaCreado) / (1000 * 60 * 60 * 24); // Días desde la creación

      // Solo considerar productos con más de 7 días de creados
      if (dias > 7) {
        const visitasPorDia = producto.visitas / dias;
        return { ...producto, visitasPorDia };
      }
      return null; // Retornar null para productos que no cumplen la condición
    })
    .filter((producto) => producto !== null); // Filtrar los nulls

  // Ordenar productos por visitas por día
  productosConVisitasPorDia.sort((a, b) => b.visitasPorDia - a.visitasPorDia);
  // Obtener los tres mejores y tres peores
  const mejores = productosConVisitasPorDia.slice(0, 3);
  const peores = productosConVisitasPorDia.slice(-3);

  return { mejores, peores };
};

"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ThemeContext } from "@/app/admin/layout";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function usePage() {
  const { webshop, setwebshop } = useContext(ThemeContext);
  const [logins, setlogins] = useState([]);
  const [compras, setcompras] = useState([]);

  useEffect(() => {
    setlogins(webshop.events.filter((obj) => obj.events == "inicio"));
    const a = webshop.events.filter((obj) => obj.events == "compra");
    setcompras(
      a.map((obj) => {
        return { ...obj.desc, created_at: obj.created_at };
      })
    );
  }, [webshop]);
  console.log(sumarComprasUltimos7Dias(compras));
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
            <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
              <Card className="lg:max-w-md" x-chunk="charts-01-chunk-0">
                <CardHeader className="space-y-0 pb-2">
                  <CardDescription>Ultimos 30 dias</CardDescription>
                  <CardTitle className="text-4xl tabular-nums">
                    {filterDatesInLast30Days(logins).length}{" "}
                    <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                      visitas
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      steps: {
                        label: "Steps",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                  >
                    <BarChart
                      accessibilityLayer
                      margin={{
                        left: -4,
                        right: -4,
                      }}
                      data={countEntriesInLast30Days(webshop.events)}
                    >
                      <Bar
                        dataKey="count"
                        fill="var(--color-steps)"
                        radius={5}
                        fillOpacity={0.6}
                        activeBar={<Rectangle fillOpacity={0.8} />}
                      />
                      <XAxis dataKey="date" />

                      <ChartTooltip
                        defaultIndex={2}
                        content={
                          <ChartTooltipContent
                            hideIndicator
                            labelFormatter={(value) => {
                              return new Date(value).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              );
                            }}
                          />
                        }
                        cursor={false}
                      />
                      <ReferenceLine
                        y={calcularPromedioPorDia(logins).promedio}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      >
                        <Label
                          position="insideBottomLeft"
                          value="Promedio diario"
                          offset={calcularPromedioPorDia(logins).promedio}
                          fill="hsl(var(--foreground))"
                        />
                        <Label
                          position="insideBottomRigth"
                          value={Number(
                            calcularPromedioPorDia(logins).promedio
                          ).toFixed(2)}
                          className="text-lg"
                          fill="hsl(var(--foreground))"
                          offset={10}
                          startOffset={100}
                        />
                      </ReferenceLine>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-1">
                  <CardDescription>
                    Durante los últimos 7 días, ha tenido{" "}
                    <span className="font-medium text-foreground">
                      {filterDatesInLast7Days(logins).length}
                    </span>{" "}
                    vistas.
                  </CardDescription>
                </CardFooter>
              </Card>
              <Card
                className="flex flex-col lg:max-w-md"
                x-chunk="charts-01-chunk-1"
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 [&>div]:flex-1">
                  <div>
                    <CardDescription>Ventas</CardDescription>
                    <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
                      ${Number(sumTotalField(compras)).toFixed(2)}
                      <span className="text-sm font-normal tracking-normal text-muted-foreground">
                        CUP
                      </span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 items-center">
                  <ChartContainer
                    config={{
                      suma: {
                        label: "Suma",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      margin={{
                        left: 14,
                        right: 14,
                        top: 10,
                      }}
                      data={sumarComprasUltimos7Dias(compras)}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="hsl(var(--muted-foreground))"
                        strokeOpacity={0.5}
                      />
                      <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                      <XAxis dataKey="dia" />
                      <Line
                        dataKey="suma"
                        type="natural"
                        fill="var(--color-resting)"
                        stroke="var(--color-resting)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          fill: "var(--color-resting)",
                          stroke: "var(--color-resting)",
                          r: 4,
                        }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            indicator="line"
                            labelFormatter={(value) => {
                              return new Date(value).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              );
                            }}
                          />
                        }
                        cursor={false}
                      />
                    </LineChart>
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
                      {filterDatesInLast30Days(logins).length}
                      <span className="text-sm font-normal text-muted-foreground">
                        visitas/mes
                      </span>
                    </div>
                    <ChartContainer
                      config={{
                        steps: {
                          label: "Steps",
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
                            date: "30 dias",
                            steps: filterDatesInLast30Days(logins).length,
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
                        <YAxis
                          dataKey="date"
                          type="category"
                          tickCount={1}
                          hide
                        />
                        <XAxis dataKey="steps" type="number" hide />
                      </BarChart>
                    </ChartContainer>
                  </div>
                  <div className="grid auto-rows-min gap-2">
                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                      {promedioVisitasPorMes(logins).promedio}
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
                            date: "Promedio Mensual",
                            steps: promedioVisitasPorMes(logins).promedio,
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
                        <YAxis
                          dataKey="date"
                          type="category"
                          tickCount={1}
                          hide
                        />
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
                    {logins.length}
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
                      data={contarVisitasPorHora(logins)}
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
                        <linearGradient
                          id="fillTime"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
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
            </div>
          </div>
        </main>
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
function countEntriesInLast30Days(entries) {
  const counts = {};
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  // Inicializar el contador para cada uno de los últimos 30 días
  for (let i = 0; i <= 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(thirtyDaysAgo.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    counts[dateString] = 0;
  }
  // Contar las entradas por fecha
  entries.forEach((entry) => {
    const date = entry.created_at.split("T")[0];
    if (counts[date] != undefined) {
      counts[date] += 1;
    }
  });

  // Convertir el objeto counts en un arreglo de objetos
  const result = Object.keys(counts).map((date) => ({
    date: convertDateToMonthDay(date),
    count: counts[date],
  }));

  return result;
}

function filterDatesInLast30Days(entries) {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);
  return entries.filter((entry) => {
    const entryDate = new Date(entry.created_at.split(" ")[0]);
    return entryDate >= thirtyDaysAgo && entryDate <= currentDate;
  });
}
function filterDatesInLast7Days(entries) {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 7);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.created_at.split(" ")[0]);
    return entryDate >= thirtyDaysAgo && entryDate <= currentDate;
  });
}
function topThreeMostVisited(products) {
  return products.sort((a, b) => b.visitas - a.visitas).slice(0, 3);
}
function topThreeLeastVisited(products) {
  return products.sort((a, b) => a.visitas - b.visitas).slice(0, 3);
}
function sumTotalField(products) {
  return products.reduce((sum, product) => sum + product.total, 0);
}

function sumLengthOfPedido(products) {
  return products.reduce((sum, product) => sum + product.pedido.length, 0);
}
function calcularPromedioPorDia(fechaArray) {
  // Crear un objeto para contar las ocurrencias de cada fecha
  const contadorFechas = {};
  // Recorrer el arreglo de fechas y contar las ocurrencias
  fechaArray.forEach((fecha) => {
    const fechaFormateada = new Date(fecha.created_at);
    fechaFormateada.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    contadorFechas[fechaFormateada] =
      (contadorFechas[fechaFormateada] || 0) + 1;
  });
  // Calcular el promedio
  const totalFechas = Object.keys(contadorFechas).length; // Total de días únicos
  const totalOcurrencias = Object.values(contadorFechas).reduce(
    (acc, curr) => acc + curr,
    0
  ); // Total de ocurrencias
  const promedio = totalOcurrencias / totalFechas;
  // Devolver el objeto con las ocurrencias y el promedio
  return {
    contadorFechas,
    promedio: Number.isNaN(promedio) ? 0 : promedio, // Evitar NaN si no hay fechas
  };
}
function contarVisitasPorHora(fechaArray) {
  // Inicializar un array para contar las visitas por hora
  const contadorHoras = Array(24).fill(0); // Array para 24 horas, inicializado en 0

  // Recorrer el arreglo de fechas
  fechaArray.forEach((fecha) => {
    const date = new Date(fecha.created_at);
    const hora = date.getHours(); // Extraer la hora (0-23)

    // Incrementar el contador para la hora correspondiente
    contadorHoras[hora] += 1;
  });

  // Crear un array para devolver resultados en el formato requerido
  const resultado = contadorHoras.map((cantidad, index) => ({
    hora: `${index < 10 ? "0" : ""}${index}:00`, // Formato HH:00
    cantidad: cantidad,
  }));

  return resultado;
}
function promedioVisitasPorMes(fechaArray) {
  const contadorMeses = {};

  // Recorrer el arreglo de fechas
  fechaArray.forEach((fecha) => {
    const date = new Date(fecha.created_at);
    const mes = date.toLocaleString("default", { month: "long" }); // Obtener el nombre del mes
    const anio = date.getFullYear(); // Obtener el año

    // Crear una clave única para el mes y el año
    const claveMes = `${mes} ${anio}`;

    // Contar las ocurrencias de cada mes
    contadorMeses[claveMes] = (contadorMeses[claveMes] || 0) + 1;
  });

  // Calcular el promedio
  const totalMeses = Object.keys(contadorMeses).length; // Total de meses únicos
  const totalOcurrencias = Object.values(contadorMeses).reduce(
    (acc, curr) => acc + curr,
    0
  ); // Total de ocurrencias

  const promedio = totalOcurrencias / totalMeses;
  // Devolver el objeto con las ocurrencias por mes y el promedio
  return {
    contadorMeses,
    promedio: Number.isNaN(promedio) ? 0 : promedio, // Evitar NaN si no hay fechas
  };
}

function sumarComprasUltimos7Dias(data) {
  const hoy = new Date();
  const sieteDiasAtras = new Date(hoy);
  sieteDiasAtras.setDate(hoy.getDate() - 7);

  // Objeto para almacenar las sumas de compras por día
  const comprasPorDia = {};

  // Recorrer los últimos 7 días
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(sieteDiasAtras);
    fecha.setDate(fecha.getDate() + i);
    const dia = fecha.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    // Inicializar el día en el objeto con 0
    comprasPorDia[dia] = 0;
  }

  // Recorrer el arreglo de datos
  data.forEach((item) => {
    const fecha = new Date(item.created_at);

    // Verificar si la fecha está dentro de los últimos 7 días
    if (fecha >= sieteDiasAtras && fecha <= hoy) {
      const dia = fecha.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      if (!comprasPorDia[dia]) {
        comprasPorDia[dia] = 0;
      }
      comprasPorDia[dia] += item.total;
    }
  });

  // Convertir el objeto a un array de resultados
  const resultado = Object.entries(comprasPorDia).map(([dia, suma]) => ({
    dia: convertDateToMonthDay(dia),
    suma,
  }));

  return resultado;
}

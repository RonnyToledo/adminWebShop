"use client";
import React, { useContext, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { ThemeContext } from "@/app/admin/layout";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

const chartConfig = {
  desktop: {
    label: "count",
    color: "#2563eb",
  },
};

export default function usePage() {
  const { webshop, setwebshop } = useContext(ThemeContext);
  const [logins, setlogins] = useState([]);
  const [compras, setcompras] = useState([]);

  useEffect(() => {
    setlogins(webshop.events.filter((obj) => obj.events == "inicio"));
    const a = webshop.events.filter((obj) => obj.events == "compra");
    setcompras(a.map((obj) => obj.desc));
  }, [webshop]);
  console.log(compras);
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <h1 className="text-2xl font-bold p-8">Visitas en el mes</h1>
        <div className="flex justify-center w-full">
          <ChartContainer
            config={chartConfig}
            className="min-h-[200px] w-10/12"
          >
            <BarChart
              accessibilityLayer
              data={countEntriesInLast30Days(webshop.events)}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" />
              <Bar dataKey="count" fill="var(--color-desktop)" radius={2} />
            </BarChart>
          </ChartContainer>
        </div>

        <main className="flex flex-1 flex-col gap-8 p-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold p-2">Estadisticas de visitas</h1>

            <div className="grid grid-cols-3 gap-2">
              <Card className="rounded-2xl  overflow-hidden">
                <BackgroundGradientAnimation className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm text-center text-white font-semibold">
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <h3 className="text-lg text-gray-100 text-center">
                          {logins.length}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </BackgroundGradientAnimation>
              </Card>

              <Card className="rounded-2xl  overflow-hidden">
                <BackgroundGradientAnimation className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm text-center text-white font-semibold">
                      Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <h3 className="text-lg text-gray-100 text-center">
                          {filterDatesInLast30Days(logins).length}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </BackgroundGradientAnimation>
              </Card>
              <Card className="rounded-2xl overflow-hidden">
                <BackgroundGradientAnimation className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm text-center text-white font-semibold">
                      Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <h3 className="text-lg text-gray-100 text-center">
                          {filterDatesInLast7Days(logins).length}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </BackgroundGradientAnimation>
              </Card>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold p-2">
              Estadisticas de Productos
            </h1>

            <div className="grid grid-cols-2 gap-2">
              <Card className="rounded-2xl  overflow-hidden">
                <BackgroundGradientAnimation className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm text-center text-white font-semibold">
                      Mas visitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <ul className="list-disc space-y-2 pl-6 text-gray-100 dark:text-gray-200">
                          {topThreeMostVisited(webshop.products).map(
                            (obj, index) => (
                              <li key={index}>{obj.title}</li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </BackgroundGradientAnimation>
              </Card>

              <Card className="rounded-2xl  overflow-hidden">
                <BackgroundGradientAnimation className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm text-center text-white font-semibold">
                      Menos Visitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <ul className="list-disc space-y-2 pl-6 text-gray-100 dark:text-gray-200">
                          {topThreeLeastVisited(webshop.products).map(
                            (obj, index) => (
                              <li key={index}>{obj.title}</li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </BackgroundGradientAnimation>
              </Card>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold p-2">Estadisticas de Ventas</h1>

            <div className="grid grid-cols-1 gap-2">
              <Card className="rounded-2xl  overflow-hidden">
                <BackgroundGradientAnimation className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm text-center text-white font-semibold">
                      Encargos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="flex items-center flex-col gap-2">
                        <h1 className="text-sm text-white font-bold p-2">
                          Recaudado
                        </h1>
                        <h1 className="text-2xl text-white  font-bold p-2">
                          ${sumTotalField(compras)}
                        </h1>
                      </div>
                      <div className="flex items-center flex-col gap-2">
                        <h1 className="text-sm text-white font-bold p-2">
                          Productos
                        </h1>
                        <h1 className="text-2xl text-white  font-bold p-2">
                          {sumLengthOfPedido(compras)}
                        </h1>
                      </div>
                    </div>
                  </CardContent>
                </BackgroundGradientAnimation>
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

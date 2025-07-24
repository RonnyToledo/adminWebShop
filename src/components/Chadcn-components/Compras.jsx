"use client";
import React from "react";
import { useContext, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
  ArrowUpRight,
  Search,
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
import { supabase } from "@/lib/supa";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  suma: {
    label: "Total",
    color: "var(--chart-1)",
  },
};

export default function Dashboard({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);
  const [busqueda, setBusqueda] = useState("");
  const [event, setEvent] = useState({
    envio: "pickup",
    pago: "cash",
    pedido: [],
    total: 0,
  });

  const [compras, setCompras] = useState(
    webshop.events
      .filter((obj) => obj.events === "compra")
      .map((obj) => ({ ...obj.desc, created_at: obj.created_at }))
  );

  useEffect(() => {
    const comprasFiltradas = webshop.events.filter(
      (obj) => obj.events === "compra"
    );
    setCompras(
      comprasFiltradas.map((obj) => ({
        ...obj.desc,
        created_at: obj.created_at,
        uid: obj.uid,
      }))
    );
  }, [webshop]);

  async function buscarEvents() {
    const { data: Events, error } = await supabase
      .from("Events")
      .select("*")
      .eq("UID_Venta", busqueda);
    if (Events?.length) {
      const [result] = Events;
      setEvent(JSON.parse(result.desc));
    }
  }

  const renderPedidos = () => {
    return event.pedido.map(
      (pedido, index) =>
        pedido.Cant > 0 && (
          <TableRow key={index}>
            <TableCell className="font-medium">{pedido.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{pedido.Cant}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {pedido.price.toFixed(2)}
            </TableCell>
          </TableRow>
        )
    );
  };
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* Tarjetas de métricas */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {[
            {
              title: "Total de Ventas",
              value: `$${Number(sumTotalField(compras)).toFixed(2)}`,
              description: "Venta general",
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              title: "Cantidad de pedidos",
              value: compras.length,
              description: "Cantidad de pedidos realizadas",
              icon: <Users className="h-4 w-4 text-muted-foreground" />,
            },
            {
              title: "Cantidad de Productos",
              value: sumLengthOfPedido(compras),
              description: "Cantidad de productos vendidos",
              icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
            },
            {
              title: "Ventas de 24 horas",
              value: `$${sumarTotalUltimas24Horas(compras)}`,
              description: "Total recaudado en las últimas 24 horas",
              icon: <Activity className="h-4 w-4 text-muted-foreground" />,
            },
          ].map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico y tabla */}
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Balance Mensual</CardTitle>
              <CardDescription>
                Ultimos 7 meses de ventas de la página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={sumarComprasUltimos7Meses(compras)}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickLine={true}
                    axisLine={true}
                    tickMargin={1}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="suma"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Buscar Pedido</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    Buscar
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buscar Pedido</DialogTitle>
                    <DialogDescription>
                      Ingrese el ID de la compra para buscar características
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="col-span-3"
                      />
                      <Button onClick={buscarEvents}>
                        <Search className="h-5 w-5" />
                      </Button>
                    </div>
                    <ScrollArea className="h-3/4 w-full rounded-md border">
                      <Table>
                        <TableCaption>
                          A list of your recent invoices.
                        </TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead className="text-right">PxU</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>{renderPedidos()}</TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">
                              ${event.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
function sumTotalField(products) {
  return products.reduce((sum, product) => sum + product.total, 0);
}
function sumarComprasUltimos7Meses(data) {
  const hoy = new Date();
  // Fecha de inicio: primero del mes, hace 6 meses
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);

  // Objeto para almacenar las sumas por mes: clave 'YYYY-MM'
  const comprasPorMes = {};

  // Inicializar los últimos 7 meses
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - 6 + i, 1);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    comprasPorMes[key] = 0;
  }

  // Sumar totales
  data.forEach((item) => {
    const fecha = new Date(item.created_at);
    if (fecha >= inicio && fecha <= hoy) {
      const key = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;
      if (key in comprasPorMes) comprasPorMes[key] += item.total;
    }
  });

  // Convertir a array y formatear nombre del mes
  return Object.entries(comprasPorMes).map(([key, suma]) => {
    const [year, month] = key.split("-");
    const nombreMes = new Date(Number(year), Number(month) - 1).toLocaleString(
      "es-ES",
      { month: "long", year: "numeric" } // <-- aquí cambiamos "large" por "long"
    );
    return { mes: nombreMes, suma };
  });
}

function sumLengthOfPedido(products) {
  return products.reduce((sum, product) => sum + product.pedido.length, 0);
}
function sumarTotalUltimas24Horas(data) {
  const ahora = new Date();
  const hace24Horas = new Date(ahora);
  hace24Horas.setHours(ahora.getHours() - 24); // Restar 24 horas

  // Filtrar los datos para obtener solo aquellos dentro de las últimas 24 horas
  const datosRecientes = data.filter((item) => {
    const fechaCreada = new Date(item.created_at);
    return fechaCreada >= hace24Horas && fechaCreada <= ahora;
  });

  // Sumar el campo "total"
  const sumaTotal = datosRecientes.reduce((acc, item) => acc + item.total, 0);

  return sumaTotal;
}

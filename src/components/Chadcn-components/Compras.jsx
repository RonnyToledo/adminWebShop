"use client";
import React from "react";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
  DialogFooter,
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

  const renderAgregados = (pedido) => {
    return pedido.agregados.map(
      (agregado, index) =>
        agregado.cantidad > 0 && (
          <TableRow key={index}>
            <TableCell className="font-medium">
              {pedido.title} - {agregado.nombre}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{agregado.cantidad}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {(pedido.price + Number(agregado.valor)).toFixed(2)}
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
          <Card className="flex flex-col w-full">
            <CardHeader>
              <CardDescription>Total de Ventas</CardDescription>
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
                  data={sumarComprasUltimos7Dias(compras)}
                  margin={{ left: 14, right: 14, top: 10 }}
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
                    stroke="var(--color-resting)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        }
                      />
                    }
                    cursor={false}
                  />
                </LineChart>
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
function convertDateToMonthDay(dateString) {
  const parts = dateString.split("-");
  const month = parts[1];
  const day = parts[2];
  return `${month}-${day}`;
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
function obtenerPrimerosCincoAntiguos(data) {
  // Ordenar el arreglo por el campo 'created_at' de más antiguo a más reciente
  const ordenado = data.sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  // Devolver los primeros 5 elementos
  return ordenado.slice(0, 5);
}

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
import { createClient } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard({ ThemeContext }) {
  const supabase = createClient();

  const { webshop, setwebshop } = useContext(ThemeContext);
  const [busqueda, setbusqueda] = useState("");
  const [event, setevent] = useState({
    envio: "pickup",
    pago: "cash",
    pedido: [],
    total: 0,
  });
  const [logins, setlogins] = useState(
    webshop.events.filter((obj) => obj.events == "inicio")
  );
  const [compras, setcompras] = useState(
    webshop.events
      .filter((obj) => obj.events == "compra")
      .map((obj) => {
        return { ...obj.desc, created_at: obj.created_at };
      })
  );

  useEffect(() => {
    setlogins(webshop.events.filter((obj) => obj.events == "inicio"));
    const a = webshop.events.filter((obj) => obj.events == "compra");
    setcompras(
      a.map((obj) => {
        return { ...obj.desc, created_at: obj.created_at, uid: obj.uid };
      })
    );
    console.log(a);
  }, [webshop]);

  async function BuscarEvents() {
    let { data: Events, error } = await supabase
      .from("Events")
      .select("*")
      .eq("uid", busqueda);
    const [a] = Events;
    setevent(JSON.parse(a.desc));
  }
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Ventas
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(sumTotalField(compras)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Venta general</p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cantidad de pedidos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{compras.length}</div>
              <p className="text-xs text-muted-foreground">
                Cantidad de pedidos realizadas
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cantidad de Productos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sumLengthOfPedido(compras)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cantidad de Productos vendidos
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas de 24 horas
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${sumarTotalUltimas24Horas(compras)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total recaudado en las ultimas 24 horas
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 ">
          <Card className="flex flex-col w-full" x-chunk="charts-01-chunk-1">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 [&>div]:flex-1">
              <div>
                <CardDescription>Total de Ventas</CardDescription>
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
                          return new Date(value).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });
                        }}
                      />
                    }
                    cursor={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-5">
            <CardHeader>
              <div className="flex items-center justify-between p-4 gap-2">
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="ml-auto gap-1">
                        Buscar
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Buscar Pedido</DialogTitle>
                        <DialogDescription>
                          Ingrese el ID de la compra para buscar caracteristicas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Input
                            id="idEvents"
                            defaultValue="Pedro Duarte"
                            className="col-span-3"
                            value={busqueda}
                            onChange={(e) => setbusqueda(e.target.value)}
                          />
                          <Button
                            variant="gosth"
                            onClick={() => BuscarEvents()}
                          >
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
                                <TableHead className="w-[100px]">
                                  Producto
                                </TableHead>
                                <TableHead className="w-[50px]">
                                  Cantidad
                                </TableHead>
                                <TableHead className="text-right w-[50px]">
                                  PxU
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {event.pedido.map((pedido, ind2) => (
                                <>
                                  {pedido.Cant > 0 && (
                                    <TableRow key={ind2}>
                                      <TableCell className="font-medium">
                                        {pedido.title}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-between items-center gap-1">
                                          <Badge variant="outline">
                                            {pedido.Cant}
                                          </Badge>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {pedido.price.toFixed(2)}{" "}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {pedido.agregados.length > 0 &&
                                    pedido.agregados.map(
                                      (agregate, ind3) =>
                                        agregate.cantidad > 0 && (
                                          <TableRow key={ind3}>
                                            <TableCell className="font-medium">
                                              {pedido.title} - {agregate.nombre}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex justify-between items-center gap-1">
                                                <Badge variant="outline">
                                                  {agregate.cantidad}
                                                </Badge>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {(
                                                pedido.price +
                                                Number(agregate.valor)
                                              ).toFixed(2)}{" "}
                                            </TableCell>
                                          </TableRow>
                                        )
                                    )}
                                </>
                              ))}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell colSpan={2}>Total</TableCell>
                                <TableCell className="text-right">
                                  $
                                  {event.total.toFixed(2) +
                                    " " +
                                    webshop.store.moneda_default.moneda}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8">
              {obtenerPrimerosCincoAntiguos(compras).map((obj, ind) => (
                <div key={ind} className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {obj.uid}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    +${Number(obj.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
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

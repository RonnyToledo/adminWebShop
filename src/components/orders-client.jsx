"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransformDate } from "./pedidos-table";
import axios from "axios";

const initialState = {
  id: 1742,
  uid: "ad65c9e9-292f-48d2-a64b-941782270896",
  desc: {
    envio: "delivery",
    pago: "transfer",
    pedido: [
      {
        id: 601,
        Cant: 1,
        caja: "d050e6dd-a417-4000-9059-43aad254f0bc",
        span: false,
        image:
          "https://res.cloudinary.com/dbgnyc842/image/upload/v1740856336/sfgvvmwm5xxm6uo29oo2.webp",
        order: 6,
        price: 1200,
        priceCompra: 0,
        title: "Luxury podwer",
        coment: {
          promedio: 0,
          total: 0,
        },
        creado: "2025-03-01T14:12:15",
        agotado: false,
        storeId: "ad65c9e9-292f-48d2-a64b-941782270896",
        visible: true,
        visitas: 0,
        favorito: false,
        oldPrice: 0,
        agregados: [],
        productId: "412109d3-6b1a-4277-a748-dac7720e33ac",
        descripcion:
          "👉🏻85gramos (son potes grandecitos)\r\n👉🏻El verdadero secreto para lucir una piel aterciopelada\r\n👉🏻El polvo banana es un polvo facial ultra fino y su función es sellar la base para que tenga mayor durabilidad.\r\n👉🏻Corrige rojeces y matices rosados\r\n👉🏻Elimina el brillo y la grasa de la piel\r\n👉🏻Se adapta al tono de la piel\r\nModo de uso💁🏻‍♀️:\r\n👉🏻Después de aplicar tu base y corrector, puedes sellar ambos con este polvo.\r\n👉🏻Uno de las mejores formas de sellarlo es con una esponjita y con la punta más pequeña, tomar un poco de polvo, así comenzar a difuminar con ella.\r\n👉🏻También se puede utilizar brocha o pincel y hacer ésta misma técnica o tomar menos producto para tener un acabado más natural.",
      },
    ],
    total: 1420,
    provincia: "Ciego de Ávila",
    municipio: "Morón",
    code: {
      discount: 0,
      name: "",
    },
    people: "Yily",
  },
  visto: false,
  events: "compra",
  nombre: "Yily",
  UID_Venta: "0f7993ee-c95f-42a8-8935-a10d44dd2b88",
  created_at: "2025-07-12T10:14:38-04:00",
};
export default function Component({ ThemeContext, specific }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [dataPedido, setDataPedido] = useState(initialState);
  const [downloading, setDownloading] = useState(false);

  console.log(
    "Webshop:",
    webshop.events.find((obj) => obj.UID_Venta === specific)
  );
  useEffect(() => {
    setDataPedido(webshop.events.find((obj) => obj.UID_Venta === specific));
  }, [specific, webshop.events]);

  async function Update(value) {
    await updateDesc(webshop.store.sitioweb, value, setWebshop, setDownloading);
  }

  const handleAgregadoUpdate = (pedido, name) => {
    if (name) {
      //Codigo si es con agregado
      const updatedAgregados = pedido.agregados.map((obj) =>
        obj.nombre === name ? { ...obj, cantidad: obj.cantidad - 1 } : obj
      );

      //Ingresar codigo para atualizar setWebshop
    } else {
      const valueAux = {
        ...dataPedido,
        desc: {
          ...dataPedido.desc,
          pedido: dataPedido.desc.pedido.map((obj) =>
            pedido.productId == obj.productId
              ? { ...obj, Cant: obj.Cant - 1 }
              : obj
          ),
        },
      };
      Update(valueAux);
    }
  };

  // Estado de carga
  if (!webshop.events) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p>Cargando pedido...</p>
      </div>
    );
  }

  // Pedido no encontrado
  if (!dataPedido) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p>No se encontró el pedido con ID: {specific}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {`Lista de productos encargados "${dataPedido?.nombre || ""}"`}
                <p className="text-base">{`${
                  dataPedido?.desc?.municipio || 0
                }-${dataPedido?.desc?.provincia || 0}`}</p>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Precio Inv.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataPedido.desc.pedido.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={order?.image || "/placeholder.svg"}
                              alt={order?.title || ""}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {order?.title || ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{order?.Cant || 0}</TableCell>
                      <TableCell>
                        ${(order?.price || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ${(order?.priceCompra || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(order.Cant * order.price || 0).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleAgregadoUpdate(order, false)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {dataPedido?.desc?.pedido.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total de pedidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {dataPedido.desc.pedido
                    .reduce(
                      (sum, order) => sum + (order.Cant * order.price || 0),
                      0
                    )
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Completados</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {dataPedido.desc.pedido
                    .reduce(
                      (sum, order) =>
                        sum + (order.Cant * (order.priceCompra || 0) || 0),
                      0
                    )
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Inversion</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  $
                  {dataPedido.desc.pedido
                    .reduce(
                      (sum, order) =>
                        sum +
                        order.Cant *
                          (order.price - (order.priceCompra || 0) || 0),
                      0
                    )
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Ganancia</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
const updateDesc = async (sitioweb, Event, setWebshop, setState) => {
  setState(true);
  console.log(Event);
  try {
    const response = await axios.put(
      `/api/tienda/${sitioweb}/checkOrders`,
      Event,
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.status === 200) {
      console.log("Registros actualizados:", response.data);
      setWebshop((prev) => {
        return {
          ...prev,
          events: prev.events.map((obj) =>
            obj.UID_Venta == response.data.data.UID_Venta
              ? response.data.data
              : obj
          ),
        };
      });
    } else {
      console.error("Error en la respuesta:", response.data.error);
    }
  } catch (error) {
    console.error("Error al conectar con la API:", error.message);
  } finally {
    setState(false);
  }
};

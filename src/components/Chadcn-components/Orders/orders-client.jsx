"use client";

import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { logoApp } from "@/utils/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
        image: logoApp,
        order: 6,
        price: 1200,
        priceCompra: 0,
        title: "",
        coment: {
          promedio: 0,
          total: 0,
        },
        creado: "2025-03-01T14:12:15",
        stock: 1,
        storeId: "ad65c9e9-292f-48d2-a64b-941782270896",
        visible: true,
        visitas: 0,
        favorito: false,
        oldPrice: 0,
        agregados: [],
        productId: "412109d3-6b1a-4277-a748-dac7720e33ac",
        descripcion: "",
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
  const router = useRouter();

  useEffect(() => {
    setDataPedido(
      (webshop?.events || []).find((obj) => obj.UID_Venta === specific)
    );
  }, [specific, webshop?.events]);

  useEffect(() => {
    const total = (dataPedido?.desc?.pedido ?? []).reduce(
      (sum, order) =>
        sum +
        (order?.Cant || 0) +
        (order?.agregados ?? []).reduce((s, ag) => s + (ag?.cant || 0), 0),
      0
    );

    if (total === 0) {
      setWebshop((prev) => {
        return {
          ...prev,
          events: prev.events.filter((obj) => obj.UID_Venta !== specific),
        };
      });
      router.push("/orders");
    }
  }, [dataPedido?.desc?.pedido, router]);

  async function Update(value) {
    toast.promise(
      updateDesc(webshop?.store.sitioweb, value, setWebshop, setDownloading),
      {
        loading: "Actualizando pedido...",
        success: () => "Pedido actualizado correctamente",
        error: (err) => err?.message ?? "Error al actualizar el pedido",
      }
    );
  }

  const handleAgregadoUpdate = (pedido, name) => {
    if (name) {
      //Codigo si es con agregado
      const updatedAgregados = pedido.agregados.map((obj) =>
        obj.name === name ? { ...obj, cant: obj.cant - 1 } : obj
      );
      //Ingresar codigo para atualizar setWebshop\
      const valueAux = {
        ...dataPedido,
        desc: {
          ...dataPedido?.desc,
          pedido: dataPedido?.desc?.pedido.map((obj) =>
            pedido.productId == obj.productId
              ? { ...obj, agregados: updatedAgregados }
              : obj
          ),
        },
      };
      Update(valueAux);
    } else {
      const valueAux = {
        ...dataPedido,
        desc: {
          ...dataPedido?.desc,
          pedido: dataPedido?.desc?.pedido.map((obj) =>
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
  if (!webshop?.events) {
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
              </CardTitle>
              <CardDescription>
                <div className="text-base">
                  Entrega: {dataPedido?.desc?.lugar}
                </div>
                <div className="text-base">
                  {dataPedido?.desc?.direccion &&
                    `Direccion: ${dataPedido?.desc?.direccion}`}
                </div>
                <div className="text-base">
                  {dataPedido?.desc?.descripcion &&
                    `Extras: ${dataPedido?.desc?.descripcion}`}
                </div>
                <div className="text-base">
                  {dataPedido?.desc?.code?.name &&
                    `Codigo de descuento: ${dataPedido?.desc?.code?.name}-${dataPedido?.desc?.code?.discount}%`}
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Embalaje</TableHead>
                    <TableHead>Precio Inv.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dataPedido?.desc?.pedido || []).map((order) => (
                    <React.Fragment key={order.id}>
                      {/* fila principal: pasamos order */}
                      {order.Cant ? (
                        <PlantillaRows
                          order={order}
                          handleAgregadoUpdate={() =>
                            handleAgregadoUpdate(order, false)
                          }
                        />
                      ) : (
                        <> </>
                      )}
                      {/* filas de agregados: normaliza propiedades y pásalas */}
                      {order.agregados &&
                        order.agregados.length > 0 &&
                        order.agregados.map((agregado, idx) => {
                          if (agregado.cant > 0) {
                            const agregadoRow = {
                              ...agregado,
                              title: `${order.title} ${agregado.name} (Agregado)`,
                              price: agregado.price || 0,
                              priceCompra: agregado.priceCompra || 0,
                              Cant:
                                agregado.cant ??
                                agregado.Cant ??
                                agregado.cantidad ??
                                0,
                              image: agregado.image || order.image || logoApp,
                              id: `${order.id}-agregado-${idx}-${agregado.nombre}`,
                            };

                            return (
                              <PlantillaRows
                                key={agregadoRow.id}
                                order={agregadoRow}
                                handleAgregadoUpdate={() =>
                                  handleAgregadoUpdate(order, agregado.name)
                                }
                              />
                            );
                          }
                          return null; // si no cumple, no renderiza nada
                        })}
                    </React.Fragment>
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
                  {dataPedido?.desc?.pedido.reduce(
                    (sum, order) =>
                      sum +
                      (order.Cant || 0) +
                      order.agregados.reduce(
                        (sumAg, ag) => sumAg + (ag.cant || 0),
                        0
                      ),
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total de pedidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {(
                    (dataPedido?.desc?.pedido.reduce(
                      (sum, order) =>
                        sum +
                        order.Cant *
                          ((order.embalaje || 0) + order.price || 0) +
                        order.agregados.reduce(
                          (sumAg, ag) =>
                            sumAg +
                            ((ag.cant || 0) *
                              (ag.price || 0 + (order.embalaje || 0)) || 0),
                          0
                        ),
                      0
                    ) *
                      (100 - (dataPedido?.desc?.code?.discount || 0))) /
                    100
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {dataPedido?.desc?.pedido
                    .reduce(
                      (sum, order) =>
                        sum +
                        (order.Cant * (order.priceCompra || 0) || 0) +
                        order.agregados.reduce(
                          (sumAg, ag) =>
                            sumAg +
                            ((ag.cant || 0) * (order.priceCompra || 0) || 0),
                          0
                        ),
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
                  {(
                    (dataPedido?.desc?.pedido.reduce(
                      (sum, order) =>
                        sum +
                        order.Cant *
                          (order.price -
                            ((order.embalaje || 0) + order.priceCompra || 0) ||
                            0) +
                        order.agregados.reduce(
                          (sumAg, ag) =>
                            sumAg +
                            ((ag.cant || 0) *
                              (ag.price -
                                ((order.priceCompra || 0) +
                                  (order.embalaje || 0)) || 0) || 0),
                          0
                        ),
                      0
                    ) *
                      (100 - (dataPedido?.desc?.code?.discount || 0))) /
                    100
                  ).toLocaleString()}
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
function PlantillaRows({ order, handleAgregadoUpdate }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={order?.image || logoApp}
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
      <TableCell>{order.embalaje || 0}</TableCell>
      <TableCell>{(order?.price || 0).toLocaleString()} </TableCell>
      <TableCell>{(order?.priceCompra || 0).toLocaleString()}</TableCell>
      <TableCell className="font-medium">
        $
        {(
          (order.Cant || 0) * (order.price || 0 + order.embalaje || 0)
        ).toLocaleString()}
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleAgregadoUpdate}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
const updateDesc = async (sitioweb, Event, setWebshop, setState) => {
  setState(true);
  try {
    const response = await axios.put(
      `/api/tienda/${sitioweb}/checkOrders`,
      Event,
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.status === 200) {
      setWebshop((prev) => {
        return {
          ...prev,
          events: prev.events.map((obj) =>
            obj.UID_Venta === Event.UID_Venta ? Event : obj
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

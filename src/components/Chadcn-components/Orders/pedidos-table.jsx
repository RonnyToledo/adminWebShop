"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  Loader,
  Loader2,
  Trash2,
  MoreHorizontal,
  Eye,
  Verified,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ThemeContext } from "@/context/useContext";
import { useRouter } from "next/navigation";
import { Calendar, Package, MessageCircle, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export function PedidosTable() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [pedidosState, setPedidosState] = useState(webshop?.events || []);
  const [WhatsApp, setWhatsApp] = useState(false);
  const [loadVerified, setLoadVerified] = useState(false);
  const [PDF, setPDF] = useState(false);
  useEffect(() => {
    setPedidosState(webshop?.events || []);
  }, [webshop?.events]);

  const handleExportToPDF = async () => {
    try {
      // 1) Confirmar pedidos (solo los no vistos)
      toast.promise(
        ConfirmarPedidos(
          pedidosState.filter((obj) => !obj.visto).map((obj) => obj.UID_Venta),
          setLoadVerified,
          webshop?.store?.sitioweb
        ),
        {
          loading: "Confirmando pedidos no vistos...",
          success: () => "Pedidos confirmados correctamente",
          error: (err) => err?.message ?? "Error al confirmar pedidos",
        }
      );
      // 2) Exportar a PDF (usa setWebshop y setPDF dentro de la función)
      const pdfResult = toast.promise(exportToPDF(pedidosState), {
        loading: "Generando PDF...",
        success: () => "PDF generado con éxito",
        error: (err) => err?.message ?? "Error al generar el PDF",
      });
      setWebshop((prev) => ({
        ...prev,
        events: prev?.events?.map((ev) => ({ ...ev, visto: true })),
      }));
      return pdfResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleSendToWhatsApp = async () => {
    const uidsToConfirm = pedidosState
      .filter((obj) => !obj.visto)
      .map((obj) => obj.UID_Venta);
    try {
      // 1) Confirmar pedidos
      toast.promise(
        ConfirmarPedidos(
          uidsToConfirm,
          setLoadVerified,
          webshop?.store?.sitioweb
        ),
        {
          loading: "Confirmando pedidos...",
          success: () => `Se confirmaron ${uidsToConfirm.length} pedido(s)`,
          error: (err) => err?.message ?? "Error al confirmar pedidos",
        }
      );
      // marcar como vistos en el estado local (solo si quieres reflejarlo en UI)
      setWebshop((prev) => ({
        ...prev,
        events: prev?.events?.map((ev) => ({ ...ev, visto: true })),
      }));
      // 2) Enviar a WhatsApp
      const result = toast.promise(
        sendToWhatsApp(pedidosState, webshop?.store, setWebshop, setWhatsApp),
        {
          loading: "Enviando pedidos a WhatsApp...",
          success: () => "Pedidos enviados a WhatsApp correctamente",
          error: (err) => err?.message ?? "Error al enviar a WhatsApp",
        }
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen  p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Gestión de Pedidos
            </h1>
            <p className="text-slate-600">
              Administra y supervisa todos los pedidos pendientes
            </p>
          </div>
        </div>
        {pedidosState.filter((obj) => !obj.visto).length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <p className="text-slate-600 text-lg">
                Confirmar todos los pedidos
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                disabled={
                  pedidosState.length == 0 || WhatsApp || PDF || loadVerified
                }
                onClick={async () =>
                  toast.promise(
                    ConfirmarPedidos(
                      pedidosState
                        .filter((obj) => !obj.visto)
                        .map((obj) => obj.UID_Venta),
                      setLoadVerified,
                      webshop?.store?.sitioweb
                    ),
                    {
                      loading: "Confirmando pedidos...",
                      success: () => "Pedidos confirmados",
                      error: (err) =>
                        err?.message ?? "Error al confirmar pedidos",
                    }
                  )
                }
              >
                {!loadVerified ? (
                  <>
                    <Verified className="w-4 h-4" />
                    <span className="sr-only">Confirmar todos</span>
                  </>
                ) : (
                  <>
                    <Loader className="animate-spin" />
                    <span className="sr-only">Preparando</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                disabled={
                  pedidosState.length == 0 || WhatsApp || PDF || loadVerified
                }
                onClick={handleSendToWhatsApp}
              >
                {!WhatsApp ? (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span className="sr-only">WhatsApp</span>
                  </>
                ) : (
                  <>
                    <Loader className="animate-spin" />
                    <span className="sr-only">Preparando</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                disabled={
                  pedidosState.length == 0 || WhatsApp || PDF || loadVerified
                }
                onClick={handleExportToPDF}
              >
                {!PDF ? (
                  <>
                    <Printer className="w-4 h-4" />
                    <span className="sr-only">Imprimir</span>
                  </>
                ) : (
                  <>
                    <Loader className="animate-spin" />
                    <span className="sr-only">Preparando</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <TablesPedidosBody
          pedidosState={pedidosState.filter((obj) => !obj.visto)}
          sitioweb={webshop?.store?.sitioweb}
          verified={true}
        />

        <TablesPedidosBody
          pedidosState={pedidosState.filter((obj) => obj.visto)}
          sitioweb={webshop?.store?.sitioweb}
        />

        {/* Empty State (if no orders) */}
        {pedidosState.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    No hay pedidos pendientes
                  </h3>
                  <p className="text-slate-500">
                    Los nuevos pedidos aparecerán aquí cuando los clientes
                    realicen compras.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
function TablesPedidosBody({ pedidosState, sitioweb, verified = false }) {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const ConfirmarPedidoUnico = async (order) => {
    try {
      const result = toast.promise(
        ConfirmarPedidos([order], setDownloading, webshop?.store?.sitioweb),
        {
          loading: "Confirmando pedido...",
          success: (data) => {
            // opcional: personaliza el texto según lo que devuelva `ConfirmarPedidos`
            return `Pedido ${order} confirmado`;
          },
          error: (err) => err?.message ?? "Error al confirmar el pedido",
        }
      );

      // actualizar estado solo si la promesa tuvo éxito
      setWebshop((prev) => ({
        ...prev,
        events: prev?.events.map((obj) =>
          obj.UID_Venta === order ? { ...obj, visto: true } : obj
        ),
      }));

      return result; // devuelve lo que devuelva ConfirmarPedidos si lo necesitas
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-white border-b border-slate-200">
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {verified
            ? "Lista de Pedidos sin confirmar"
            : "Lista de Pedidos Confirmados"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700">
                  Cliente
                </th>
                <th className="text-left p-4 font-semibold text-slate-700">
                  Identificador
                </th>
                <th className="text-left p-4 font-semibold text-slate-700">
                  Compra
                </th>
                <th className="text-left p-4 font-semibold text-slate-700">
                  Productos
                </th>
                <th className="text-left p-4 font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pedidosState.map((order, index) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                          {order.desc.people.charAt(0).toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.desc.people}
                        </p>
                        <p className="text-sm text-slate-500">
                          Cliente #{index + 1}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
                        {order.UID_Venta.substring(0, 8)}...
                      </code>
                      <p className="text-xs text-slate-500">ID del pedido</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">
                        {formatFecha(order.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {" "}
                        {order?.desc?.pedido.reduce(
                          (sum, producto) =>
                            sum +
                            producto.Cant +
                            producto.agregados.reduce(
                              (suma, ag) => suma + ag.cant,
                              0
                            ),
                          0
                        )}
                      </span>
                      <span className="text-sm text-slate-500">
                        {order?.desc?.pedido.reduce(
                          (sum, producto) =>
                            sum +
                            producto.Cant +
                            producto.agregados.reduce(
                              (suma, ag) => suma + ag.cant,
                              0
                            ),
                          0
                        ) === 1
                          ? "producto"
                          : "productos"}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger disabled={downloading} asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          {!downloading ? (
                            <MoreHorizontal className="h-4 w-4" />
                          ) : (
                            <Loader2 className="w-4 h-4" />
                          )}

                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {!order.visto && (
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={async () =>
                              await ConfirmarPedidoUnico(order.UID_Venta)
                            }
                          >
                            <Verified className="w-4 h-4" />
                            Confirmar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() =>
                            router.push(`/orders/${order.UID_Venta}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => {
                            if (order.phonenumber && order.phonenumber !== 0) {
                              const phoneNumber = order.phonenumber;
                              const message = `Hola, soy de ${webshop?.store?.name}`;
                              const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                                message
                              )}`;
                              window.open(url, "_blank"); // abre WhatsApp en una nueva pestaña
                            } else {
                              toast.error(
                                "El usuario no ha dado número de teléfono para ser localizado"
                              );
                            }
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Contactar cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() =>
                            EliminateDesc(
                              sitioweb,
                              order.UID_Venta,
                              setDownloading,
                              setWebshop
                            )
                          }
                        >
                          {!downloading ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            <Loader2 className="w-4 h-4" />
                          )}
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
export function TransformDate(dateString) {
  const fecha = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES").format(fecha);
}
export async function exportToPDF(pedidos) {
  const doc = new jsPDF();

  doc.text("Pedidos en Espera", 14, 15);

  let totalGlobal = 0; // Variable para el precio total global

  // Recorrer los pedidos
  pedidos.map((pedido, pedidoIndex) => {
    // Agregar un encabezado con el nombre del cliente y el número de pedido
    doc.text(
      `Pedido #${pedidoIndex + 1} - Cliente: ${pedido.nombre}\n`,
      14,
      doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 28
    );

    const productos = [];
    let totalPedido = 0; // Variable para el precio total de cada pedido

    // Recorrer los productos del pedido
    pedido.desc.pedido.forEach((producto) => {
      if (producto.Cant > 0) {
        const totalProducto = producto.Cant * producto.price;
        totalPedido += totalProducto; // Agregar al total del pedido

        productos.push([
          "No disponible", // Columna de imagen que se omite
          producto.title,
          `$${producto.price.toFixed(2)}`,
          producto.Cant,
          `$${totalProducto.toFixed(2)}`,
        ]);
      }
      // Si el producto tiene agregados, agregarlos a la tabla
      producto.agregados.forEach((agregado) => {
        if (agregado.cantidad > 0) {
          const totalAgregado =
            agregado.cantidad * (producto.price + agregado.valor);
          totalPedido += totalAgregado; // Agregar al total del pedido

          productos.push([
            "No disponible", // Columna de imagen que se omite
            `${producto.title} - ${agregado.nombre} (agregado)`,
            `$${(producto.price + agregado.valor).toFixed(2)}`,
            agregado.cantidad,
            `$${totalAgregado.toFixed(2)}`,
          ]);
        }
      });
    });

    // Agregar el total de la venta al final de la tabla
    productos.push([
      "", // Columna de imagen que se omite
      "Total del Pedido",
      "",
      "",
      `$${totalPedido.toFixed(2)}`,
    ]);

    // Generar la tabla en el PDF
    doc.autoTable({
      head: [["Imagen", "Título", "Precio Unitario", "Cantidad", "Total"]],
      body: productos,
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30,
      columnStyles: {
        0: { cellWidth: 20 }, // Deja espacio para la columna de imagen (sin usar)
      },
    });

    // Agregar el precio total del pedido a la variable global
    totalGlobal += totalPedido;
  });

  // Agregar el precio global al final del documento
  doc.text(
    `Total Global de Ventas: $${totalGlobal.toFixed(2)}`,
    14,
    doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30
  );

  // Guardar el archivo PDF generado con el nombre de los pedidos
  const fileName = `pedidos-en-espera-${new Date().toISOString()}.pdf`;
  doc.save(fileName);
}

export async function sendToWhatsApp(pedidos, store, setWebshop, setWhatsApp) {
  await updateEvents(
    store?.sitioweb,
    pedidos.map((obj) => obj.UID_Venta),
    setWebshop,
    setWhatsApp
  );
  let mensaje = "";
  let totalPedido = 0; // Variable para el precio total de cada pedido

  pedidos.map((compra, index) => {
    mensaje += `Pedido #${index + 1} de ${compra.nombre}:\n
    - Metodo de envio: ${
      compra.desc.envio === "pickup" ? "Recoger en Tienda" : "Envío a Domicilio"
    }\n
    - Tipo de Pago: ${
      compra.desc.pago === "cash" ? "Efectivo" : "Transferencia"
    }\n
    ${
      compra.desc.envio !== "pickup"
        ? `- Provincia: ${compra.desc.provincia}\n- Municipio: ${compra.desc.municipio}\n`
        : ""
    }
    - ID de Venta: ${compra.UID_Venta}\n
    - Productos:\n`;

    compra.desc.pedido.forEach((producto, index) => {
      if (producto.Cant > 0) {
        mensaje += `   ${index + 1}. ${producto.title} x${
          producto.Cant
        }: ${Number(
          producto.Cant * producto.price * (1 / store?.moneda_default.valor)
        ).toFixed(2)}\n`;
      }
      producto.agregados.forEach((agregate) => {
        if (agregate.cantidad > 0) {
          mensaje += `   . ${producto.title}-${agregate.nombre} x${
            agregate.cantidad
          }: ${(
            (producto.price + Number(agregate.valor)) *
            agregate.cantidad *
            (1 / store?.moneda_default.valor)
          ).toFixed(2)}\n`;
        }
      });
    });

    mensaje += `- Total de la orden: ${Number(
      compra.desc.total * (1 - compra.desc.code.discount / 100)
    ).toFixed(2)} ${store?.moneda_default.moneda}\n`;
    mensaje += `${
      compra.desc.code.name != ""
        ? `- Codigo de Descuento: ${compra.desc.code.name}`
        : ""
    }\n\n`;
    totalPedido += compra.desc.total * (1 - compra.desc.code.discount / 100); // Variable para el precio total de cada pedido
  });

  mensaje += `- Total de la orden: ${totalPedido}`;
  // Codificar el mensaje para la URL
  const encodedMessage = encodeURIComponent(mensaje);

  // Abrir WhatsApp Web con el mensaje
  window.open(`https://wa.me/${store?.cell}?text=${encodedMessage}`, "_blank");
}

function formatFecha(fechaString) {
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-ES"); // 'dd/mm/aaaa'
}
async function ConfirmarPedidos(uids, setDownloading, sitioweb) {
  setDownloading(true);

  try {
    const response = await axios.post(
      `/api/tienda/${sitioweb}/checkOrders`,
      { uids },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error al ejecutar la función RPC:", error);
  } finally {
    setDownloading(false);
  }
}

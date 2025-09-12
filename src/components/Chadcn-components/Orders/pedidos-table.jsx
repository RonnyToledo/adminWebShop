"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { Loader, Loader2, Trash2, MoreHorizontal, Eye } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

export function PedidosTable() {
  const { toast } = useToast();
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [pedidosState, setPedidosState] = useState(webshop?.events || []);
  const [WhatsApp, setWhatsApp] = useState(false);
  const [PDF, setPDF] = useState(false);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    setPedidosState((webshop?.events || []).filter((obj) => !obj.visto));
  }, [webshop?.events]);

  const handleExportToPDF = () => {
    exportToPDF(pedidosState, webshop?.store, setWebshop, setPDF);
  };

  const handleSendToWhatsApp = () => {
    sendToWhatsApp(pedidosState, webshop?.store, setWebshop, setWhatsApp);
  };
  return (
    <div className="min-h-screen  p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Gestión de Pedidos
            </h1>
            <p className="text-slate-600">
              Administra y supervisa todos los pedidos pendientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              disabled={pedidosState.length == 0 || WhatsApp || PDF}
              onClick={handleSendToWhatsApp}
            >
              {!WhatsApp ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
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
              disabled={pedidosState.length == 0 || WhatsApp || PDF}
              onClick={handleExportToPDF}
            >
              {!PDF ? (
                <>
                  <Printer className="w-4 h-4" />
                  Imprimir
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

        {/* Orders Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-white border-b border-slate-200">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Lista de Pedidos
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
                      Fecha Envío
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
                              {order.desc.people.charAt(0).toUpperCase()}
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
                          <p className="text-xs text-slate-500">
                            ID del pedido
                          </p>
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
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {" "}
                            {order?.desc?.pedido.reduce(
                              (sum, producto) => sum + producto.Cant,
                              0
                            )}
                          </span>
                          <span className="text-sm text-slate-500">
                            {order?.desc?.pedido.reduce(
                              (sum, producto) => sum + producto.Cant,
                              0
                            ) === 1
                              ? "producto"
                              : "productos"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
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
                                if (
                                  order.phonenumber &&
                                  order.phonenumber !== 0
                                ) {
                                  const phoneNumber = order.phonenumber;
                                  const message = `Hola, soy de ${webshop?.store?.name}`;
                                  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                                    message
                                  )}`;
                                  window.open(url, "_blank"); // abre WhatsApp en una nueva pestaña
                                } else {
                                  toast({
                                    title: "Error",
                                    description:
                                      "El usuario no ha dado número de teléfono para ser localizado",
                                    variant: "destructive",
                                  });
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
                                  webshop?.store?.sitioweb,
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
export function TransformDate(dateString) {
  const fecha = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES").format(fecha);
}
export async function exportToPDF(pedidos, store, setWebshop, setPDF) {
  /* await updateEvents(
    store?.sitioweb,
    pedidos.map((obj) => obj.UID_Venta),
    setWebshop,
    setPDF
  ); /*/
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
const updateEvents = async (sitioweb, uids, setWebshop, setState) => {
  setState(true);
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

    if (response.status === 200) {
      setWebshop((prev) => {
        return {
          ...prev,
          events: response.data.data,
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

const EliminateDesc = async (sitioweb, UID_Venta, setState, setWebshop) => {
  setState(true);

  try {
    const response = await fetch(`/api/tienda/${sitioweb}/checkOrders`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid: UID_Venta }), // Aquí va el cuerpo de la solicitud
    });

    if (response.status === 200) {
      setWebshop((prev) => {
        return {
          ...prev,
          events: prev.events.filter((obj) => obj.UID_Venta !== UID_Venta),
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
function formatFecha(fechaString) {
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-ES"); // 'dd/mm/aaaa'
}
function WhatsAppRedirectButton(phoneNumber, tienda) {
  const message = `Hola, quiero más información acerca de su pedido en ${tienda}.`;
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  // Usar location.href o window.open para ir fuera del dominio
  window.open(url, "_blank"); // o simplemente: window.location.href = url;
}

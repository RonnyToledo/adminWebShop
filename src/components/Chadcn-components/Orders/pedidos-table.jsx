"use client";
import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  Trash2,
  MoreHorizontal,
  Eye,
  Verified,
  MessageCircle,
  Printer,
  Package,
  Calendar,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ThemeContext } from "@/context/useContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sileo } from "sileo";

// ─── Botón de acción con tooltip ──────────────────────────────────────────────
function ActionButton({ onClick, disabled, loading, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center justify-center w-9 h-9 rounded-xl border border-border transition-all duration-200 ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-transparent"
          : "hover:bg-secondary/60 hover:border-primary/30 cursor-pointer bg-transparent"
      }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
      ) : (
        <Icon size={14} className="text-foreground" />
      )}
    </button>
  );
}

// ─── Tabla de pedidos ─────────────────────────────────────────────────────────
function TablesPedidosBody({ pedidosState, sitioweb, verified = false }) {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);

  const confirmarUnico = async (uid) => {
    sileo.promise(
      ConfirmarPedidos([uid], setDownloading, webshop?.store?.sitioweb),
      {
        loading: { title: "Confirmando pedido..." },
        success: () => ({ title: `Pedido confirmado` }),
        error: (err) => ({
          title: "Error",
          description: err?.message ?? "Error al confirmar",
        }),
      },
    );
    setWebshop((prev) => ({
      ...prev,
      events: prev?.events.map((obj) =>
        obj.UID_Venta === uid ? { ...obj, visto: true } : obj,
      ),
    }));
  };

  if (pedidosState.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${verified ? "bg-amber-400" : "bg-emerald-500"}`}
          />
          {verified ? "Pendientes de confirmar" : "Pedidos confirmados"}
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {pedidosState.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Cliente", "ID pedido", "Fecha", "Productos", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosState.map((order, index) => (
                <tr
                  key={order.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors last:border-0"
                >
                  {/* Cliente */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {(order.desc?.people || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {order.desc?.people}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          #{index + 1}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* ID */}
                  <td className="px-4 py-3">
                    <code className="text-xs bg-secondary px-2 py-1 rounded font-mono text-muted-foreground">
                      {order.UID_Venta.substring(0, 8)}…
                    </code>
                  </td>
                  {/* Fecha */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar
                        size={12}
                        className="text-primary/60 shrink-0"
                      />
                      {new Date(order.created_at).toLocaleDateString("es-ES")}
                    </div>
                  </td>
                  {/* Productos */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      {order?.desc?.pedido.reduce(
                        (sum, p) =>
                          sum +
                          p.Cant +
                          p.agregados.reduce((s, ag) => s + ag.cant, 0),
                        0,
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      productos
                    </span>
                  </td>
                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger disabled={downloading} asChild>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                          {downloading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <MoreHorizontal size={14} />
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!order.visto && (
                          <DropdownMenuItem
                            className="gap-2 text-sm"
                            onClick={() => confirmarUnico(order.UID_Venta)}
                          >
                            <Verified size={14} /> Confirmar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={() =>
                            router.push(`/orders/${order.UID_Venta}`)
                          }
                        >
                          <Eye size={14} /> Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={() => {
                            if (order.phonenumber && order.phonenumber !== 0) {
                              window.open(
                                `https://wa.me/${order.phonenumber}?text=${encodeURIComponent(`Hola, soy de ${webshop?.store?.name}`)}`,
                                "_blank",
                              );
                            } else {
                              sileo.error({
                                title: "Sin teléfono",
                                description:
                                  "El cliente no proporcionó número de contacto",
                              });
                            }
                          }}
                        >
                          <MessageCircle size={14} /> Contactar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-sm text-destructive focus:text-destructive"
                          onClick={() =>
                            EliminateDesc(
                              sitioweb,
                              order.UID_Venta,
                              setDownloading,
                              setWebshop,
                            )
                          }
                        >
                          <Trash2 size={14} /> Eliminar
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

// ─── Componente principal ─────────────────────────────────────────────────────
export function PedidosTable() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [pedidosState, setPedidosState] = useState(webshop?.events || []);
  const [WhatsApp, setWhatsApp] = useState(false);
  const [loadVerified, setLoadVerified] = useState(false);
  const [PDF, setPDF] = useState(false);

  useEffect(() => {
    setPedidosState(webshop?.events || []);
  }, [webshop?.events]);

  const noVistos = pedidosState.filter((o) => !o.visto);
  const vistos = pedidosState.filter((o) => o.visto);
  const busy = pedidosState.length === 0 || WhatsApp || PDF || loadVerified;

  const handleExportToPDF = async () => {
    sileo.promise(
      ConfirmarPedidos(
        noVistos.map((o) => o.UID_Venta),
        setLoadVerified,
        webshop?.store?.sitioweb,
      ),
      {
        loading: { title: "Confirmando pedidos..." },
        success: () => ({ title: "Pedidos confirmados" }),
        error: (e) => ({ title: "Error", description: e?.message }),
      },
    );
    sileo.promise(exportToPDF(pedidosState), {
      loading: { title: "Generando PDF..." },
      success: () => ({ title: "PDF generado" }),
      error: (e) => ({
        title: "Error al generar PDF",
        description: e?.message,
      }),
    });
    setWebshop((prev) => ({
      ...prev,
      events: prev?.events?.map((ev) => ({ ...ev, visto: true })),
    }));
  };

  const handleSendToWhatsApp = async () => {
    sileo.promise(
      ConfirmarPedidos(
        noVistos.map((o) => o.UID_Venta),
        setLoadVerified,
        webshop?.store?.sitioweb,
      ),
      {
        loading: { title: "Confirmando pedidos..." },
        success: () => ({ title: "Pedidos confirmados" }),
        error: (e) => ({ title: "Error", description: e?.message }),
      },
    );
    setWebshop((prev) => ({
      ...prev,
      events: prev?.events?.map((ev) => ({ ...ev, visto: true })),
    }));
    sileo.promise(
      sendToWhatsApp(pedidosState, webshop?.store, setWebshop, setWhatsApp),
      {
        loading: { title: "Enviando a WhatsApp..." },
        success: () => ({ title: "Enviado a WhatsApp" }),
        error: (e) => ({ title: "Error", description: e?.message }),
      },
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Gestión
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Pedidos
          </h1>
        </div>

        {noVistos.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">
              {noVistos.length} sin confirmar
            </span>
            <ActionButton
              onClick={() =>
                sileo.promise(
                  ConfirmarPedidos(
                    noVistos.map((o) => o.UID_Venta),
                    setLoadVerified,
                    webshop?.store?.sitioweb,
                  ),
                  {
                    loading: { title: "Confirmando..." },
                    success: () => ({ title: "Confirmados" }),
                    error: (e) => ({ title: "Error", description: e?.message }),
                  },
                )
              }
              disabled={busy}
              loading={loadVerified}
              icon={Verified}
              label="Confirmar todos"
            />
            <ActionButton
              onClick={handleSendToWhatsApp}
              disabled={busy}
              loading={WhatsApp}
              icon={MessageCircle}
              label="Enviar a WhatsApp"
            />
            <ActionButton
              onClick={handleExportToPDF}
              disabled={busy}
              loading={PDF}
              icon={Printer}
              label="Exportar PDF"
            />
          </div>
        )}
      </div>

      {/* Tablas */}
      <TablesPedidosBody
        pedidosState={noVistos}
        sitioweb={webshop?.store?.sitioweb}
        verified
      />
      <TablesPedidosBody
        pedidosState={vistos}
        sitioweb={webshop?.store?.sitioweb}
      />

      {/* Empty state */}
      {pedidosState.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Package size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                Sin pedidos pendientes
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Los nuevos pedidos aparecerán aquí cuando los clientes realicen
                compras.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────
async function ConfirmarPedidos(uids, setDownloading, sitioweb) {
  setDownloading(true);
  try {
    await axios.post(
      `/api/tienda/${sitioweb}/checkOrders`,
      { uids },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error al confirmar pedidos:", error);
    throw error;
  } finally {
    setDownloading(false);
  }
}

async function EliminateDesc(sitioweb, uid, setDownloading, setWebshop) {
  setDownloading(true);
  try {
    await axios.delete(`/api/tienda/${sitioweb}/checkOrders`, {
      data: { uid },
      headers: { "Content-Type": "application/json" },
    });
    setWebshop((prev) => ({
      ...prev,
      events: prev.events.filter((o) => o.UID_Venta !== uid),
    }));
  } catch (err) {
    console.error(err);
  } finally {
    setDownloading(false);
  }
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
      doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 28,
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
    doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30,
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
    setWhatsApp,
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
          producto.Cant * producto.price * (1 / store?.moneda_default.valor),
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
      compra.desc.total * (1 - compra.desc.code.discount / 100),
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

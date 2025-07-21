"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import axios from "axios";
import { Loader, Loader2, Trash2, MoreHorizontal, Eye } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ThemeContext } from "@/context/useContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function PedidosTable() {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [pedidosState, setPedidosState] = useState(webshop.events);
  const [WhatsApp, setWhatsApp] = useState(false);
  const [PDF, setPDF] = useState(false);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    setPedidosState(webshop.events.filter((obj) => !obj.visto));
  }, [webshop.events]);

  const handleExportToPDF = () => {
    exportToPDF(pedidosState, webshop.store, setWebshop, setPDF);
  };

  const handleSendToWhatsApp = () => {
    sendToWhatsApp(pedidosState, webshop.store, setWebshop, setWhatsApp);
  };
  console.log(pedidosState);
  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <div className="text-lg font-semibold text-gray-700">
          Pedidos sin confirmar
        </div>
        <div className=" flex justify-end space-x-2">
          <Button
            size="icon"
            type="button"
            disabled={pedidosState.length == 0 || WhatsApp || PDF}
            variant="outline"
            onClick={handleSendToWhatsApp}
          >
            {!WhatsApp ? (
              <>
                <WhatsAppIcon />
                <span className="sr-only">Enviar por WhatsApp</span>
              </>
            ) : (
              <>
                <Loader className="animate-spin" />
                <span className="sr-only">Preparando</span>
              </>
            )}
          </Button>
          <Button
            size="icon"
            type="button"
            variant="outline"
            disabled={pedidosState.length == 0 || WhatsApp || PDF}
            onClick={handleExportToPDF}
          >
            {!PDF ? (
              <>
                <PictureAsPdfIcon />
                <span className="sr-only">Exportar a PDF</span>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Identificador</TableHead>
            <TableHead>Enviado</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Accion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidosState
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell>{pedido.desc.people}</TableCell>
                <TableCell>{pedido.UID_Venta}</TableCell>
                <TableCell>{TransformDate(pedido.created_at)}</TableCell>
                <TableCell>
                  {pedido?.desc?.pedido.reduce(
                    (sum, producto) => sum + producto.Cant,
                    0
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="flex flex-col gap-3 p-2">
                        <Button
                          variant="outline"
                          className="flex gap-2"
                          onClick={() =>
                            router.push(`/admin/orders/${pedido.UID_Venta}`)
                          }
                        >
                          <Eye />
                          Ver
                        </Button>

                        <Button
                          variant="outline"
                          className="flex gap-2"
                          onClick={() =>
                            EliminateDesc(
                              webshop.store.sitioweb,
                              pedido.UID_Venta,
                              setDownloading,
                              setWebshop
                            )
                          }
                        >
                          {!downloading ? <Trash2 /> : <Loader2 />}
                          Eliminar
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
export function TransformDate(dateString) {
  const fecha = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES").format(fecha);
}
export async function exportToPDF(pedidos, store, setWebshop, setPDF) {
  /* await updateEvents(
    store.sitioweb,
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
    store.sitioweb,
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
          producto.Cant * producto.price * (1 / store.moneda_default.valor)
        ).toFixed(2)}\n`;
      }
      producto.agregados.forEach((agregate) => {
        if (agregate.cantidad > 0) {
          mensaje += `   . ${producto.title}-${agregate.nombre} x${
            agregate.cantidad
          }: ${(
            (producto.price + Number(agregate.valor)) *
            agregate.cantidad *
            (1 / store.moneda_default.valor)
          ).toFixed(2)}\n`;
        }
      });
    });

    mensaje += `- Total de la orden: ${Number(
      compra.desc.total * (1 - compra.desc.code.discount / 100)
    ).toFixed(2)} ${store.moneda_default.moneda}\n`;
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
  window.open(`https://wa.me/${store.cell}?text=${encodedMessage}`, "_blank");
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
      console.log("Registros actualizados:", response.data);
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
      console.log("Registros actualizados:", response.data);
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

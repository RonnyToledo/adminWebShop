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
import { Loader } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import WidgetsIcon from "@mui/icons-material/Widgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export function PedidosTable({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [pedidosState, setPedidosState] = useState(webshop.events);
  const [WhatsApp, setWhatsApp] = useState(false);
  const [PDF, setPDF] = useState(false);

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
            <TableHead>Productos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidosState.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell>{pedido.desc.people}</TableCell>
              <TableCell>{pedido.UID_Venta}</TableCell>
              <TableCell>
                <DialogComponent
                  pedido={pedido.desc.pedido}
                  setWebshop={setWebshop}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export async function exportToPDF(pedidos, store, setWebshop, setPDF) {
  await updateEvents(
    store.sitioweb,
    pedidos.map((obj) => obj.UID_Venta),
    setWebshop,
    setPDF
  );
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
      }
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

  /* Crear un mensaje con los detalles de los pedidos
  let message = "Pedidos en Espera:\n\n";
  pedidos.forEach((pedido) => {
    message += `ID: ${pedido.id}\n`;
    message += `Cliente: ${pedido.cliente}\n`;
    message += `Fecha: ${pedido.fecha}\n`;
    message += `Total: $${pedido.total.toFixed(2)}\n`;
    message += `Estado: ${pedido.estado}\n\n`;
  });*/
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
          events: prev.events.map((obj) => {
            return { ...obj, visto: true };
          }),
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
function DialogComponent({ pedido, setWebshop }) {
  const [Order, setOrder] = useState(pedido);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <WidgetsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
          <DialogDescription>
            Puedes eliminar aquellos productos que ha sido rechadazos en la
            orden
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 rounded-md border">
          <div className="p-4">
            {Order.map((item, i) => (
              <div key={i}>
                <ListProducts pedido={item} />
                {item.agregados.map(
                  (agregate, ind3) =>
                    agregate.cantidad > 0 && (
                      <ListProducts
                        pedido={item}
                        key={ind3}
                        agregate={agregate}
                      />
                    )
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function ListProducts({ pedido, agregate }) {
  const handleAgregadoUpdate = (nombre, incremento) => {
    const updatedAgregados = prod.agregados.map((obj) =>
      obj.nombre === nombre
        ? { ...obj, cantidad: obj.cantidad + incremento }
        : obj
    );
    dispatchStore({
      type: "AddCart",
      payload: JSON.stringify({ ...prod, agregados: updatedAgregados }),
    });
    AnimationCart();
  };
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
      <Image
        src={
          pedido.image ||
          "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
        }
        alt={pedido.title || "Producto"}
        width={200}
        height={200}
        className="rounded-xl object-cover h-20 w-20"
      />
      <div className="flex-grow">
        <h2 className="font-semibold">
          {pedido.title}
          {agregate?.nombre && ` - ${agregate.nombre}`}
        </h2>
        <p className="text-blue-600 font-bold">
          $
          {agregate?.valor
            ? (pedido.price + Number(agregate.valor)).toFixed(2)
            : Number(pedido.price).toFixed(2)}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full"
          onClick={() => handleAgregadoUpdate(pedido.productId)}
          type="button"
        >
          <DeleteOutlineIcon />
        </Button>
      </div>
    </div>
  );
}

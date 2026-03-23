import jsPDF from "jspdf";
import "jspdf-autotable";

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

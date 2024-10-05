"use client";
import React, { useState, useContext, useMemo } from "react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { ThemeContext } from "@/app/admin/layout";
import { Switch } from "../ui/switch";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";

export default function TableRowsComponent({
  products, // Cambia el valor predeterminado a un arreglo vacío
  setProducts,
  categoria,
}) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const filteredProducts = useMemo(
    () => products.filter((obj) => obj.caja === categoria),
    [products, categoria]
  );

  const deleteProduct = async (value, image) => {
    setDownloading(true);
    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("Id", value);
    try {
      await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/products/${value}/`,
        {
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    } catch (error) {
      console.error("Error :", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo eliminar el producto.",
      });
    } finally {
      toast({
        title: "Tarea Ejecutada",
        description: "Información Actualizada",
        action: (
          <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
        ),
      });
      setWebshop((prev) => ({
        ...prev,
        products: prev.products.filter((obj) => obj.productId !== value),
      }));
      setDownloading(false);
    }
  };

  const DragAndDrop = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    )
      return;
    setProducts(
      OrderProducts(
        products,
        webshop.store.categoria,
        categoria,
        source.index,
        destination.index
      )
    );
  };

  return (
    <DragDropContext onDragEnd={DragAndDrop}>
      <Droppable droppableId={"default"}>
        {(droppableProvided) => (
          <TableBody
            {...droppableProvided.droppableProps}
            ref={droppableProvided.innerRef}
          >
            {filteredProducts.map((obj, ind) => (
              <Draggable
                key={`${obj.productId}-${ind}`}
                draggableId={String(obj.productId)}
                index={ind}
              >
                {(draggableProvided) => (
                  <TableRow
                    {...draggableProvided.draggableProps}
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.dragHandleProps}
                  >
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={obj.title || `Producto${ind}`}
                        className="aspect-square rounded-md object-cover"
                        height={64}
                        src={
                          obj.image ||
                          "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                        }
                        style={{ aspectRatio: "64/64", objectFit: "cover" }}
                        width={64}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{obj.title}</TableCell>
                    <TableCell>
                      <Switch
                        checked={obj.agotado}
                        onCheckedChange={(value) =>
                          setProducts((prev) =>
                            prev.map((prod) =>
                              prod.productId === obj.productId
                                ? { ...prod, agotado: value }
                                : prod
                            )
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${Number(obj.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {obj.caja || "Sin categoría"}{" "}
                        {obj.order < 100000 && `-${obj.order}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {obj.favorito ? "Si" : "No"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <div className="sr-only">Toggle menu</div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="flex flex-col gap-3 p-2">
                            <Link
                              className="flex gap-3 w-full justify-start items-center"
                              href={`/admin/products/${obj.productId}`}
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Link>
                            <Button
                              className="flex gap-3 w-full justify-start items-center"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                deleteProduct(obj.productId, obj.image)
                              }
                            >
                              {!downloading ? (
                                <Trash2 className="h-3 w-3" />
                              ) : (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )}
              </Draggable>
            ))}
            {droppableProvided.placeholder}
          </TableBody>
        )}
      </Droppable>
    </DragDropContext>
  );
}

const reorder = (list, startIndex, endIndex) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
function OrderProducts(productos, categorias, specific, startIndex, endIndex) {
  const productosOrdenados = {};

  // Inicializar el objeto con categorías vacías
  categorias.forEach((categoria) => {
    productosOrdenados[categoria] = [];
  });

  // Llenar el objeto con productos según su categoría
  productos.forEach((producto) => {
    if (productosOrdenados[producto.caja]) {
      productosOrdenados[producto.caja].push(producto);
    }
  });

  // Reordenar los productos en la categoría específica
  const reorderedProducts = reorder(
    productos.filter((obj) => obj.caja == specific),
    startIndex,
    endIndex
  );
  // Asignar el resultado de la categoría reordenada
  productosOrdenados[specific] = reorderedProducts;
  // Retornar el resultado final con el orden asignado
  return asignarOrden(productosOrdenados);
}
const asignarOrden = (productos) => {
  const resultadoFinal = [];

  Object.keys(productos).forEach((categoria) => {
    // Verificar que productos[categoria] sea un arreglo
    if (Array.isArray(productos[categoria])) {
      resultadoFinal.push(
        ...productos[categoria].map((prod, index) => ({
          ...prod,
          order: index,
        }))
      );
    } else {
      console.warn(
        `La categoría ${categoria} no es un arreglo`,
        productos[categoria]
      );
    }
  });

  return resultadoFinal;
};

"use client";
import React, { useState, useContext, useEffect } from "react";
import { TableCell } from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { ThemeContext } from "@/context/useContext";
import { Switch } from "../ui/switch";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export default function TableRowsComponentAgotados({ products, setProducts }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

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
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const sourceCategory = source.droppableId;
    const destCategory = destination.droppableId;
    const sourceIndex = source.index;
    const destIndex = destination.index;

    if (sourceCategory === destCategory) {
      // Reordenar dentro de la misma categoría
      setProducts((prevProducts) =>
        OrderProducts(
          prevProducts,
          webshop.store.categoria.map((obj) => obj.id),
          sourceIndex,
          destIndex,
          sourceCategory
        )
      );
    } else {
      // Mover el producto a una nueva categoría
      setProducts((prevProducts) => {
        const newPrev = prevProducts.map((prod) =>
          prod.productId === draggableId
            ? { ...prod, caja: destCategory, order: destIndex }
            : prod
        );

        const productToMove = newPrev.find(
          (prod) => prod.productId === draggableId
        );
        if (productToMove) {
          // Aplicar la nueva organización
          return OrderProducts(
            newPrev,
            webshop.store.categoria.map((obj) => obj.id),
            sourceIndex,
            destIndex
          );
        }
        return newPrev;
      });
    }
  };

  return (
    <DragDropContext onDragEnd={DragAndDrop}>
      {webshop.store.categoria.map((categoria, ind) => (
        <TableComponet
          key={ind}
          name={categoria.name}
          id={categoria.id}
          ListProducts={products.filter((obj) => obj.caja == categoria.id)}
          setProducts={setProducts}
          downloading={downloading}
          deleteProduct={deleteProduct}
        />
      ))}
      {products.filter(
        (prod) =>
          !webshop.store.categoria.map((obj) => obj.id).includes(prod.caja)
      ).length > 0 && (
        <TableComponet
          name={"Sin Categoria"}
          ListProducts={products.filter(
            (prod) =>
              !webshop.store.categoria.map((obj) => obj.id).includes(prod.caja)
          )}
          id={"00000000-0000-0000-0000-000000000000"}
          setProducts={setProducts}
          downloading={downloading}
          deleteProduct={deleteProduct}
        />
      )}
    </DragDropContext>
  );
}
function TableComponet({
  name,
  ListProducts,
  setProducts,
  downloading,
  deleteProduct,
  id,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen </TableHead>

              <TableHead>Nombre</TableHead>
              <TableHead>Agotado</TableHead>
              <TableHead className="hidden md:table-cell">Precio</TableHead>
              <TableHead className="hidden md:table-cell">Orden</TableHead>
              <TableHead className="hidden md:table-cell">Favorito</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <Droppable droppableId={id}>
            {(droppableProvided) => (
              <TableBody
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
              >
                {ListProducts.length == 0 && <div className="min-h-20"></div>}
                {ListProducts.map((obj, ind) => (
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
                        <TableCell>
                          <Image
                            alt={obj.title || `Producto${ind}`}
                            className="aspect-square rounded-md object-cover"
                            height={64}
                            src={
                              obj.image ||
                              "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                            }
                            style={{
                              aspectRatio: "64/64",
                              objectFit: "cover",
                            }}
                            width={64}
                          />
                        </TableCell>
                        <TableCell className="font-medium line-clamp-2">
                          {obj.title}
                        </TableCell>
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
                            {obj.order < 100000 && `${obj.order}`}
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
        </Table>
      </CardContent>
    </Card>
  );
}
const reorder = (list, startIndex, endIndex) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
function OrderProducts(productos, categorias, startIndex, endIndex, specific) {
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

  if (specific !== "none" && specific != undefined) {
    // Reordenar los productos en la categoría específica
    const reorderedProducts = reorder(
      productos.filter((obj) => obj.caja == specific),
      startIndex,
      endIndex
    );
    // Asignar el resultado de la categoría reordenada
    productosOrdenados[specific] = reorderedProducts;
  }
  const sin_category = productos.filter(
    (prod) => !categorias.includes(prod.caja)
  );

  // Retornar el resultado final con el orden asignado
  return [...asignarOrden(productosOrdenados), ...sin_category];
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

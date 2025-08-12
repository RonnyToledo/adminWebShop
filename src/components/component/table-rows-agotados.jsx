"use client";
import React, { useState, useContext } from "react";
import { TableCell } from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import { RadioGroupItem, RadioGroup } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import UnfoldMoreDoubleRoundedIcon from "@mui/icons-material/UnfoldMoreDoubleRounded";
import { ExtraerCategorias } from "../globalFunction/function";
import { logoApp } from "@/utils/image";
import {
  Search,
  Plus,
  FileText,
  GripVertical,
  Eye,
  EyeOff,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TableRowsComponentAgotados({
  products,
  setProducts,
  moveElements,
}) {
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
            webshop?.store?.categoria.map((obj) => obj.id),
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
      {(
        (moveElements
          ? ExtraerCategorias(webshop?.store?.categoria, products)
          : webshop?.store?.categoria) || []
      ).map((categoria, ind) => (
        <TableComponet
          key={ind}
          name={categoria.name}
          id={categoria.id}
          ListProducts={products.filter((obj) => obj.caja == categoria.id)}
          setProducts={setProducts}
          downloading={downloading}
          deleteProduct={deleteProduct}
          moveElements={moveElements}
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
          moveElements={moveElements}
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
  moveElements,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {name}
          <Badge variant="secondary" className="ml-2">
            {ListProducts.length} productos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="hidden md:table-cell">Imagen </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Agot.</TableHead>
              <TableHead className="hidden md:table-cell">Precio</TableHead>
              <TableHead className="hidden md:table-cell">Orden</TableHead>
              <TableHead className="hidden md:table-cell">Visible</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <Droppable droppableId={id}>
            {(droppableProvided) => (
              <TableBody
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
              >
                {ListProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="min-h-[5rem] text-center">
                      No hay productos en esta categoría
                    </TableCell>
                  </TableRow>
                )}
                {ListProducts.sort((a, b) => a.order - b.order).map(
                  (obj, ind) => (
                    <Draggable
                      key={`${obj.productId}-${ind}`}
                      draggableId={String(obj.productId)}
                      index={ind}
                      isDragDisabled={moveElements}
                    >
                      {(draggableProvided) => (
                        <TableRow
                          {...draggableProvided.draggableProps}
                          ref={draggableProvided.innerRef}
                          className={`${
                            !obj.visible
                              ? "bg-red-100 hover:bg-red-200"
                              : obj.agotado
                              ? "bg-gray-300 hover:bg-gray-400"
                              : "bg-white hover:bg-gray-100"
                          } `}
                        >
                          {/* Columna de las tres barras como drag handle */}
                          <TableCell
                            className="cursor-grab"
                            {...draggableProvided.dragHandleProps} // Solo aquí se aplican los dragHandleProps
                          >
                            <div className="cursor-grab hover:cursor-grabbing">
                              <GripVertical className="h-4 w-4 text-slate-400" />
                            </div>
                          </TableCell>

                          {/* Columna de imagen */}
                          <TableCell>
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                              <Image
                                src={obj.image || logoApp}
                                alt={obj.title || `Producto${ind}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </TableCell>
                          {/* Columna de descripción */}
                          <TableCell className="p-1 w-full text-sm max-w-24 line-clamp-3 overflow-hidden h-20">
                            <div className="font-medium text-slate-900">
                              <HoverComponent obj={obj} />
                            </div>
                          </TableCell>

                          {/* Columna del switch */}
                          <TableCell className="p-1">
                            <div className="flex items-center justify-center">
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
                            </div>
                          </TableCell>

                          {/* Columna de precio */}
                          <TableCell className="hidden md:table-cell">
                            <span className="font-semibold text-slate-900">
                              ${Number(obj.price).toFixed(2)}
                            </span>
                          </TableCell>

                          {/* Orden */}
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="font-mono">
                              {obj.order}
                            </Badge>
                          </TableCell>

                          {/* Visible */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setProducts((prev) =>
                                    prev.map((prod) =>
                                      prod.productId === obj.productId
                                        ? {
                                            ...prod,
                                            visible: !obj.visible,
                                            modified: new Date().toISOString(),
                                          }
                                        : prod
                                    )
                                  )
                                }
                                className="h-8 w-8 p-0"
                              >
                                {obj.visible ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-slate-400" />
                                )}
                              </Button>
                            </div>
                          </TableCell>

                          {/* Menú de opciones */}
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
                                  <Button variant="ghost" asChild>
                                    <Link
                                      className="flex gap-3 w-full justify-start items-center"
                                      href={`/products/${obj.productId}`}
                                    >
                                      <Pencil className="h-3 w-3" />
                                      Edit
                                    </Link>
                                  </Button>
                                  <Button
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
                  )
                )}
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
export const Promedio = (array, field) => {
  if (!array?.length) return 0;
  const total = array.reduce((acc, obj) => acc + (obj[field] || 0), 0);
  return total / array.length;
};
function HoverComponent({ obj }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="link"
          className="line-clamp-3 h-full w-full whitespace-normal p-0"
        >
          {obj.title}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src={obj.image || logoApp} />
            <AvatarFallback>{obj.title}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{obj.title}</h4>
            <p className="text-sm line-clamp-2">{obj.description}</p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                ${Number(obj.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

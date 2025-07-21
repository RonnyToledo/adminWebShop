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
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

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
      {(moveElements
        ? ExtraerCategorias(webshop.store.categoria, products)
        : webshop.store.categoria
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
  // Estado para el criterio de ordenamiento
  const [sortCriteria, setSortCriteria] = useState("none");

  const handleSortChange = (criteria) => {
    setSortCriteria(criteria);

    // Ordenar según el criterio seleccionado
    const sortedProducts = [...ListProducts];
    switch (criteria) {
      case "price-asc":
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        sortedProducts.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "visitas-asc":
        sortedProducts.sort((a, b) => {
          a.visitas === b.visitas ? a.order - b.order : a.visitas - b.visitas;
        });
        break;
      case "visitas-desc":
        sortedProducts.sort((a, b) => {
          a.visitas === b.visitas ? a.order - b.order : b.visitas - a.visitas;
        });
        break;
      case "rating-asc":
        sortedProducts.sort((a, b) => {
          Promedio(a.coment, "star") === Promedio(b.coment, "star")
            ? a.order - b.order
            : Promedio(b.coment, "star") - Promedio(a.coment, "star");
        });
        break;

      case "none":
      default:
        // Restaurar el orden original o mantenerlo
        sortedProducts.sort((a, b) => a.order - b.order);
        break;
    }

    // Actualizar la lista ordenada

    const newArray = sortedProducts.map((obj, index) => {
      return { ...obj, order: index };
    });
    console.log(newArray);
    setProducts((productsMap) => {
      const updatedArray = productsMap.map((item1) => {
        const item2 = newArray.find(
          (item) => item.productId === item1.productId
        );
        return item2 ? item2 : item1;
      });
      console.log(updatedArray);
      return updatedArray;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          {name}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <LowPriorityIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-2">
              <RadioGroup
                onValueChange={handleSortChange}
                defaultValue={sortCriteria}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="r1" />
                  <Label htmlFor="r1">Nada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price-asc" id="r2" />
                  <Label htmlFor="r2">Precio Ascendente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price-desc" id="r3" />
                  <Label htmlFor="r3">Precio Descendente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name-asc" id="r4" />
                  <Label htmlFor="r4">Nombre Descendente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name-desc" id="r5" />
                  <Label htmlFor="r5">Nombre Descendente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visitas-asc" id="r4" />
                  <Label htmlFor="r4">Mas Frecuentes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visitas-desc" id="r5" />
                  <Label htmlFor="r5">Menos Frecuentes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rating-desc" id="r5" />
                  <Label htmlFor="r5">Rating Descendente</Label>
                </div>
              </RadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <UnfoldMoreDoubleRoundedIcon />
              </TableHead>
              <TableHead className="hidden md:table-cell">Imagen </TableHead>

              <TableHead>Nombre</TableHead>
              <TableHead>Agot.</TableHead>
              <TableHead className="hidden md:table-cell">Precio</TableHead>
              <TableHead className="hidden md:table-cell">Orden</TableHead>
              <TableHead className="hidden md:table-cell">Visible</TableHead>
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
                {ListProducts.length === 0 && <div className="min-h-20"></div>}
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
                          className={`container ${
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
                            <div
                              className={`flex items-center justify-center ${
                                !moveElements
                                  ? "text-gray-700"
                                  : "text-gray-300"
                              }`}
                            >
                              <MenuRoundedIcon />
                            </div>
                          </TableCell>

                          {/* Columna de imagen */}
                          <TableCell className="hidden md:table-cell">
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

                          {/* Columna de descripción */}
                          <TableCell className="p-1 w-full text-sm max-w-24 line-clamp-3 overflow-hidden h-20">
                            <HoverComponent obj={obj} />
                          </TableCell>

                          {/* Columna del switch */}
                          <TableCell className="p-1">
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

                          {/* Columna de precio */}
                          <TableCell className="hidden md:table-cell">
                            ${Number(obj.price).toFixed(2)}
                          </TableCell>

                          {/* Orden */}
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">
                              {obj.order < 100000 && `${obj.order}`}
                            </Badge>
                          </TableCell>

                          {/* Favorito */}
                          <TableCell className="hidden md:table-cell">
                            <Switch
                              checked={obj.visible}
                              onCheckedChange={(value) =>
                                setProducts((prev) =>
                                  prev.map((prod) =>
                                    prod.productId === obj.productId
                                      ? { ...prod, visible: value }
                                      : prod
                                  )
                                )
                              }
                            />
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
                                      href={`/admin/products/${obj.productId}`}
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
            <AvatarImage
              src={
                obj.image ||
                "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
              }
            />
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

"use client";

import React, { useState, useContext, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import { useRouter } from "next/navigation";
import { format } from "@formkit/tempo";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import ConfimationOut from "@/components/globalFunction/confimationOut";

export function ProductManagementSystem() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    // Solo actualizar si realmente hay cambios
    if (JSON.stringify(products) !== JSON.stringify(webshop.products)) {
      setProducts(webshop.products);
    }
  }, [webshop.products]);

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

  const toggleProductStatus = (productId, field) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.productId === productId
          ? { ...product, [field]: !product[field] }
          : product
      )
    );
  };
  const getSelectedProductIds = () => {
    return selectedProducts.map((selected) => selected.productId);
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some(
      (selected) => selected.productId === productId
    );
  };
  const toggleProductSelection = (productId, image) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some(
        (selected) => selected.productId === productId
      );
      if (isSelected) {
        return prev.filter((selected) => selected.productId !== productId);
      } else {
        return [...prev, { productId, image }];
      }
    });
  };

  const toggleSelectAllInCategory = (categoryId) => {
    const category = webshop?.store?.categoria.find(
      (cat) => cat.id === categoryId
    );
    if (!category) return;
    const categoryProducts = products
      .filter((p) => p.caja == category.id)
      .map((p) => ({
        productId: p.productId,
        image: p.image,
      }));
    const categoryProductIds = products
      .filter((p) => p.caja == category.id)
      .map((p) => p.productId);
    const selectedIds = getSelectedProductIds();
    const allSelected = categoryProductIds.every((productId) =>
      selectedIds.includes(productId)
    );

    setSelectedProducts((prev) => {
      if (allSelected) {
        // Remover todos los productos de esta categoría
        return prev.filter(
          (selected) => !categoryProductIds.includes(selected.productId)
        );
      } else {
        // Agregar todos los productos de esta categoría que no estén seleccionados
        const newSelections = categoryProducts.filter(
          (product) =>
            !prev.some((selected) => selected.productId === product.productId)
        );
        return [...prev, ...newSelections];
      }
    });
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const deleteProduct = async (value) => {
    setDownloading(true);

    // validación mínima
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setDownloading(false);
      toast.error("No hay productos para eliminar");
      return;
    }

    const formData = new FormData();
    formData.append("values", JSON.stringify(value));

    // construimos la promesa de eliminación (axios devuelve una Promise)
    const deletePromise = axios.delete(
      `/api/tienda/${webshop.store.sitioweb}/products/`,
      {
        data: formData,
        // No forzar Content-Type para que el navegador ponga el boundary correcto
        // headers: { "Content-Type": "multipart/form-data" },
      }
    );

    try {
      // toast.promise mostrará loading / success / error automáticamente
      const res = await toast.promise(deletePromise, {
        loading: "Eliminando productos...",
        success: (response) => {
          // si la petición fue satisfactoria, actualizamos el estado aquí
          // (usar getSelectedProductIds() tal como lo tenías)
          const selectedIds = value.map((selected) => selected.productId);
          setWebshop((prev) => ({
            ...prev,
            products: prev.products.filter(
              (product) => !selectedIds.includes(product.productId)
            ),
          }));

          setSelectedProducts([]);

          // personaliza el mensaje de éxito según la respuesta del backend
          return (
            response?.data?.message ?? "Productos eliminados correctamente"
          );
        },
        error: (err) => {
          // Sonner espera string; devolvemos mensaje legible
          const msg =
            err?.response?.data?.message ?? err?.message ?? "Error al eliminar";
          return `Error: ${msg}`;
        },
      });

      // `res` es la respuesta axios en caso de éxito (opcional devolver o usar)
      return res;
    } catch (err) {
      // ya mostramos toast de error desde toast.promise, pero igual logueamos
      console.error("deleteProduct error:", err);
      toast.error("Error");
      // opcional: lanzar para manejo fuera de la función
      // throw err;
    } finally {
      setDownloading(false);
    }
  };

  const SaveData = async () => {
    setDownloading(true);

    // obtenemos los productos modificados
    const modified = obtenerProductosModificados(webshop.products, products);

    // validación rápida: si no hay cambios, avisamos y salimos
    if (!modified || (Array.isArray(modified) && modified.length === 0)) {
      setDownloading(false);
      toast("No hay cambios para guardar");
      return;
    }

    const formData = new FormData();
    formData.append("products", JSON.stringify(modified));

    // la promesa que realiza la petición PUT
    const putPromise = axios.put(
      `/api/tienda/${webshop.store.sitioweb}/products`,
      formData
      // no pongas headers aquí; dejar que el navegador determine Content-Type + boundary
    );

    try {
      // toast.promise mostrará loading / success / error automáticamente
      const res = toast.promise(putPromise, {
        loading: "Guardando cambios...",
        success: (response) => {
          // Actualizamos el estado local con la lista 'products' (asumiendo que 'products' ya
          // contiene la versión actualizada que quieres guardar en el backend)
          setWebshop((prev) => ({
            ...prev,
            products: products,
          }));

          // opcional: si quieres limpiar/reevaluar algún estado, hazlo aquí
          // setSomeOtherState(...);
          // mensaje de éxito mostrado por Sonner
          const count = Array.isArray(modified) ? modified.length : 1;
          return `${count} producto${count === 1 ? "" : "s"} actualizado${
            count === 1 ? "" : "s"
          } correctamente`;
        },
        error: (err) => {
          // Construimos un mensaje legible para el usuario
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo actualizar";
          return `Error: ${msg}`;
        },
      });

      // devuelve la respuesta si hace falta usarla
      return res;
    } catch (err) {
      // El toast de error ya salió por toast.promise, pero dejamos el log
      console.error("SaveData error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const totalSelected = selectedProducts.length;

  return (
    <div className="space-y-3 md:space-y-6">
      {totalSelected > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary">
                {totalSelected} producto{totalSelected !== 1 ? "s" : ""}{" "}
                seleccionado{totalSelected !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <X className="w-4 h-4 md:mr-2" />
                    <div className="hidden md:flex">Limpiar selección</div>
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 md:mr-2" />
                      <div className="hidden md:flex">
                        Eliminar seleccionados
                      </div>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente {totalSelected}{" "}
                        producto{totalSelected !== 1 ? "s" : ""}. Esta acción no
                        se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProduct(selectedProducts)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={DragAndDrop}>
        <div className="grid gap-3 md:gap-6">
          {webshop?.store?.categoria.map((category) => {
            const categoryProductIds = products
              .filter((p) => p.caja == category.id)
              .map((p) => p.productId);
            const selectedIds = getSelectedProductIds();
            const selectedInCategory = categoryProductIds.filter((id) =>
              selectedIds.includes(id)
            ).length;
            const allSelectedInCategory =
              categoryProductIds.length > 0 &&
              selectedInCategory === categoryProductIds.length;
            const someSelectedInCategory =
              selectedInCategory > 0 &&
              selectedInCategory < categoryProductIds.length;
            return (
              <Card key={category.id} className="bg-card">
                <CardHeader className="p-3 md:pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {products.filter((obj) => obj.caja == category.id)
                        .length > 0 && (
                        <Checkbox
                          checked={allSelectedInCategory}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelectedInCategory;
                          }}
                          onCheckedChange={() =>
                            toggleSelectAllInCategory(category.id)
                          }
                        />
                      )}
                      <span className="text-xl font-bold text-card-foreground">
                        {category.name}
                      </span>
                      {selectedInCategory > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          {selectedInCategory} seleccionado
                          {selectedInCategory !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground"
                    >
                      {products.filter((obj) => obj.caja == category.id).length}{" "}
                      productos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-6 md:pt-0">
                  <Droppable droppableId={category.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-[100px] rounded-lg border-2 border-dashed transition-colors",
                          snapshot.isDraggingOver
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/20"
                        )}
                      >
                        <div className="grid  gap-2 md:gap-4 p-2 md:p-4">
                          {products
                            .filter((obj) => obj.caja == category.id)
                            .sort((a, b) => a.order - b.order)
                            .map((product, index) => (
                              <Draggable
                                key={product.productId}
                                draggableId={product.productId}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      `bg-gradient-to-br from-background ${
                                        product.visible
                                          ? "to-background"
                                          : "to-red-500/10"
                                      } border border-border rounded-lg p-2 md:p-4 transition-all`,
                                      snapshot.isDragging &&
                                        "shadow-lg rotate-2 scale-105",
                                      isProductSelected(product.productId) &&
                                        "border border-slate-300 bg-primary/5"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 md:gap-4">
                                      <Checkbox
                                        checked={isProductSelected(
                                          product.productId
                                        )}
                                        onCheckedChange={() =>
                                          toggleProductSelection(
                                            product.productId,
                                            product.image
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <h4 className="text-slate-700">
                                        {product.order < 9999
                                          ? product.order + 1
                                          : ""}
                                        .
                                      </h4>
                                      <Dialog>
                                        <DialogTrigger
                                          asChild
                                          className="hidden md:flex"
                                        >
                                          <div className="cursor-pointer hover:opacity-80 transition-opacity">
                                            <Image
                                              width={300}
                                              height={200}
                                              src={product.image || logoApp}
                                              alt={product.title}
                                              className="w-16 h-16 filter object-cover rounded-md border border-border  aspect-square"
                                              style={{
                                                filter: product.stock
                                                  ? "initial"
                                                  : "grayscale(1)",
                                              }}
                                            />
                                          </div>
                                        </DialogTrigger>

                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader>
                                            <DialogTitle></DialogTitle>
                                            <DialogDescription></DialogDescription>
                                          </DialogHeader>

                                          <Image
                                            width={300}
                                            height={200}
                                            src={product.image || logoApp}
                                            alt={product.title}
                                            className="w-full h-auto rounded-lg aspect-square"
                                          />
                                        </DialogContent>
                                      </Dialog>

                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">
                                          {product.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground text-slate-600">
                                          Creado:{" "}
                                          {format(
                                            new Date(product.creado),
                                            "short"
                                          )}
                                        </p>
                                        <p className="text-sm text-primary text-slate-800">
                                          ${product.price.toFixed(2)} -{" "}
                                          {webshop?.store?.monedas.find(
                                            (currency) =>
                                              currency.id ==
                                              product?.default_moneda
                                          )?.nombre ??
                                            webshop?.store?.monedas.find(
                                              (currency) => currency.defecto
                                            )?.nombre ??
                                            ""}
                                        </p>
                                      </div>

                                      <div className="flex gap-3">
                                        {!webshop?.store?.stocks && (
                                          <div className="flex flex-col items-center gap-2">
                                            <Switch
                                              checked={product.stock}
                                              onCheckedChange={() =>
                                                setProducts((prev) =>
                                                  prev.map((prod) =>
                                                    product.productId ===
                                                    prod.productId
                                                      ? {
                                                          ...product,
                                                          stock: product.stock
                                                            ? 0
                                                            : 1,
                                                        }
                                                      : prod
                                                  )
                                                )
                                              }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                              {product.stock
                                                ? webshop?.store?.stocks
                                                  ? `${product.stock} unidades`
                                                  : "En Stock"
                                                : "Agotado"}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex  flex-col-reverse items-center gap-2">
                                          <Switch
                                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800"
                                            checked={product.visible}
                                            onCheckedChange={() =>
                                              toggleProductStatus(
                                                product.productId,
                                                "visible"
                                              )
                                            }
                                          />
                                          <span className="text-sm text-muted-foreground">
                                            {!product.visible
                                              ? "Oculto"
                                              : "Visible"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="hidden md:flex flex-col-reverse gap-1 ">
                                        {product.stock ? (
                                          webshop?.store?.stocks ? (
                                            <Badge
                                              className="text-xs"
                                              variant="outline"
                                            >
                                              {product.stock} unidades
                                            </Badge>
                                          ) : (
                                            <Badge
                                              className="text-xs"
                                              variant="outline"
                                            >
                                              En stock
                                            </Badge>
                                          )
                                        ) : (
                                          <Badge
                                            variant="destructive"
                                            className="text-xs"
                                          >
                                            Agotado
                                          </Badge>
                                        )}
                                        {!product.visible ? (
                                          <Badge
                                            variant="default"
                                            className="text-xs"
                                          >
                                            <EyeOff className="w-3 h-3 mr-1" />
                                            Oculto
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Visible
                                          </Badge>
                                        )}
                                      </div>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem asChild>
                                            <Link
                                              href={`/products/${product.productId}`}
                                            >
                                              <Edit className="w-4 h-4 mr-2" />
                                              Editar producto
                                            </Link>
                                          </DropdownMenuItem>

                                          <DropdownMenuItem asChild>
                                            <Link
                                              href={`/products/${product.productId}`}
                                            >
                                              <Eye className="w-4 h-4 mr-2" />
                                              Ver en tienda
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={async () =>
                                              await deleteProduct([
                                                {
                                                  productId: product.productId,
                                                  image: product.image,
                                                },
                                              ])
                                            }
                                          >
                                            {!downloading ? (
                                              <>
                                                <Trash2 className="h-3 w-3" />
                                                Eliminar
                                              </>
                                            ) : (
                                              <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Eliminando
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                          {products.filter((obj) => obj.caja == category.id)
                            .length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              Arrastra productos aquí o agrega nuevos
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
      <div className="backdrop-blur-sm p-2 flex justify-center sticky bottom-0">
        <Button
          onClick={SaveData}
          type="submit"
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
            downloading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={downloading}
        >
          Guardar
        </Button>
      </div>
      <ConfimationOut action={hasPendingChanges(products, webshop.products)} />
    </div>
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
const hasPendingChanges = (data, store) => {
  return JSON.stringify(data) !== JSON.stringify(store);
};
const obtenerProductosModificados = (productosOriginales, productosNuevos) => {
  // Crear un objeto de búsqueda para los productos originales
  const productosMap = Object.fromEntries(
    productosOriginales.map((producto) => [producto.productId, producto])
  );

  return productosNuevos.filter((productoNuevo) => {
    const productoOriginal = productosMap[productoNuevo.productId];
    return (
      productoOriginal &&
      (productoOriginal.stock !== productoNuevo.stock ||
        productoOriginal.order !== productoNuevo.order ||
        productoOriginal.visible !== productoNuevo.visible ||
        productoOriginal.caja !== productoNuevo.caja)
    );
  });
};

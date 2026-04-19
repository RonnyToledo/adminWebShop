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
  DropdownMenuSeparator,
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
  AlertTriangle,
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
import apiClient from "@/lib/apiClient";
import { sileo } from "sileo";
import Link from "next/link";
import ConfirmationOut from "@/components/globalFunction/confirmationOut";
// ↓ helpers del modelo normalizado
import {
  getDisplayPrice,
  getMaxPrice,
  getTotalStock,
  isMultiVariant,
  getVariantSummary,
} from "@/utils/variants";

const UNCATEGORIZED_ID = "uncategorized";

// ─── Price display helper (con moneda) ────────────────────────────────────────
function ProductPriceLabel({ product, webshop }) {
  const moneda =
    webshop?.store?.monedas?.find((c) => c.id === product?.default_moneda) ??
    webshop?.store?.monedas?.find((c) => c.defecto);

  const monedaNombre = moneda?.nombre ?? "";
  const min = getDisplayPrice(product);
  const max = getMaxPrice(product);
  const multi = isMultiVariant(product) && min !== max;
  const sinPrecio = min === 0 && max === 0; // ← nuevo

  if (sinPrecio) {
    return (
      <p className="text-sm text-muted-foreground">Sin precio configurado</p>
    );
  }

  return (
    <p className="text-sm text-primary">
      {multi ? `desde ` : ""}${min.toFixed(2)}
      {multi && max > 0 && ` – $${max.toFixed(2)}`}
      {monedaNombre && ` ${monedaNombre}`}
    </p>
  );
}

// ─── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ product, webshop }) {
  const total = getTotalStock(product); // seguro ahora con el fix 1
  const summary = getVariantSummary(product);

  if (summary) {
    return (
      <Badge variant="outline" className="text-xs font-normal">
        {summary}
      </Badge>
    );
  }

  if (total > 0) {
    return webshop?.store?.stocks ? (
      <Badge variant="outline" className="text-xs">
        {total} unidades
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        En stock
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="text-xs">
      Agotado
    </Badge>
  );
}

export function ProductManagementSystem() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    setProducts(webshop?.products || []);
  }, [webshop?.products]);

  const uncategorizedProducts = React.useMemo(() => {
    const validCategoryIds =
      webshop?.store?.categoria?.map((cat) => cat.id) || [];
    return products.filter(
      (product) =>
        !product.caja ||
        product.caja === UNCATEGORIZED_ID ||
        !validCategoryIds.includes(product.caja),
    );
  }, [products, webshop?.store?.categoria]);

  const allCategories = React.useMemo(() => {
    const categories = [...(webshop?.store?.categoria || [])];
    if (uncategorizedProducts.length > 0) {
      categories.push({
        id: UNCATEGORIZED_ID,
        name: "Sin categoría",
        isVirtual: true,
      });
    }
    return categories;
  }, [webshop?.store?.categoria, uncategorizedProducts]);

  const DragAndDrop = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const sourceCategory = source.droppableId;
    const destCategory = destination.droppableId;
    const sourceIndex = source.index;
    const destIndex = destination.index;

    if (sourceCategory === destCategory) {
      setProducts((prev) =>
        OrderProducts(
          prev,
          allCategories.map((o) => o.id),
          sourceIndex,
          destIndex,
          sourceCategory,
        ),
      );
    } else {
      setProducts((prev) => {
        const newPrev = prev.map((prod) =>
          prod.productId === draggableId
            ? {
                ...prod,
                caja: destCategory === UNCATEGORIZED_ID ? null : destCategory,
                order: destIndex,
              }
            : prod,
        );
        const productToMove = newPrev.find(
          (prod) => prod.productId === draggableId,
        );
        if (productToMove) {
          return OrderProducts(
            newPrev,
            allCategories.map((o) => o.id),
            sourceIndex,
            destIndex,
            destCategory,
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
          : product,
      ),
    );
  };

  // Toggle stock en modo simple — afecta la variante default
  const toggleSimpleStock = (productId) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.productId !== productId) return prod;
        if (isMultiVariant(prod)) return prod; // ← guardia extra, aunque el JSX ya lo filtra
        const currentStock = getTotalStock(prod);
        const newStock = currentStock > 0 ? 0 : 1;
        const updatedVariants = (prod.product_variants ?? []).map((v) =>
          v.attributes?.es_default ? { ...v, stock: newStock } : v,
        );
        // Si no hay variantes (Enguatada), actualizar solo prod.stock
        return {
          ...prod,
          stock: newStock,
          product_variants:
            updatedVariants.length > 0
              ? updatedVariants
              : prod.product_variants,
        };
      }),
    );
  };

  const getSelectedProductIds = () => selectedProducts.map((s) => s.productId);
  const isProductSelected = (productId) =>
    selectedProducts.some((s) => s.productId === productId);
  const toggleProductSelection = (productId, image) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((s) => s.productId === productId);
      return isSelected
        ? prev.filter((s) => s.productId !== productId)
        : [...prev, { productId, image }];
    });
  };

  const getCategoryProducts = React.useCallback(
    (categoryId) => {
      if (categoryId === UNCATEGORIZED_ID) return uncategorizedProducts;
      return products.filter((p) => p.caja === categoryId);
    },
    [products, uncategorizedProducts],
  );

  const toggleSelectAllInCategory = (categoryId) => {
    const categoryProducts = getCategoryProducts(categoryId).map((p) => ({
      productId: p.productId,
      image: p.image,
    }));
    const categoryProductIds = categoryProducts.map((p) => p.productId);
    const selectedIds = getSelectedProductIds();
    const allSelected = categoryProductIds.every((id) =>
      selectedIds.includes(id),
    );
    setSelectedProducts((prev) => {
      if (allSelected)
        return prev.filter((s) => !categoryProductIds.includes(s.productId));
      const newSelections = categoryProducts.filter(
        (p) => !prev.some((s) => s.productId === p.productId),
      );
      return [...prev, ...newSelections];
    });
  };

  // toggleVariantStock — toggle de una variante específica por su id
  const toggleVariantStock = (productId, variantId) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.productId !== productId) return prod;
        const updatedVariants = (prod.product_variants ?? []).map((v) => {
          if (v.id !== variantId) return v;
          const newStock = (Number(v.stock) || 0) > 0 ? 0 : 1;
          return { ...v, stock: newStock };
        });
        return { ...prod, product_variants: updatedVariants };
      }),
    );
  };

  const clearSelection = () => setSelectedProducts([]);

  const deleteProduct = async (value) => {
    setDownloading(true);
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setDownloading(false);
      sileo.error({
        title: "Error",
        description: "No hay productos para eliminar",
      });
      return;
    }
    const formData = new FormData();
    formData.append("values", JSON.stringify(value));
    const deletePromise = apiClient.delete(
      `/api/tienda/${webshop?.store?.sitioweb}/products/`,
      { data: formData },
    );
    try {
      await sileo.promise(deletePromise, {
        loading: { title: "Eliminando productos..." },
        success: (response) => {
          const selectedIds = value.map((s) => s.productId);
          setWebshop((prev) => ({
            ...prev,
            products: prev.products.filter(
              (p) => !selectedIds.includes(p.productId),
            ),
          }));
          setSelectedProducts([]);
          return {
            title: "Productos eliminados",
            description: response?.data?.message,
          };
        },
        error: (err) => ({
          title: "Error al eliminar",
          description: err?.response?.data?.message ?? err?.message,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const SaveData = async () => {
    setDownloading(true);
    const modified = obtenerProductosModificados(
      webshop?.products || [],
      products,
    );
    if (!modified || modified.length === 0) {
      setDownloading(false);
      sileo.info({ title: "No hay cambios para guardar" });
      return;
    }
    const formData = new FormData();
    formData.append("products", JSON.stringify(modified));
    const putPromise = apiClient.put(
      `/api/tienda/${webshop?.store?.sitioweb}/products`,
      formData,
    );
    try {
      await sileo.promise(putPromise, {
        loading: { title: "Guardando cambios..." },
        success: (response) => {
          setWebshop((prev) => ({ ...prev, products }));
          const count = modified.length;
          return {
            title: `${count} producto${count === 1 ? "" : "s"} actualizado${count === 1 ? "" : "s"}`,
          };
        },
        error: (err) => ({
          title: "Error al guardar",
          description: err?.response?.data?.message ?? err?.message,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const totalSelected = selectedProducts.length;
  console.log(products);
  return (
    <div className="space-y-3 md:space-y-6">
      {totalSelected > 0 && (
        <Card className="bg-primary/5 border-primary/20 sticky top-16 z-10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary">
                {totalSelected} producto{totalSelected !== 1 ? "s" : ""}{" "}
                seleccionado{totalSelected !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Limpiar selección</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">
                        Eliminar seleccionados
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente {totalSelected}{" "}
                        producto{totalSelected !== 1 ? "s" : ""}. No se puede
                        deshacer.
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
          {allCategories.map((category) => {
            const categoryProducts = getCategoryProducts(category.id);
            const categoryProductIds = categoryProducts.map((p) => p.productId);
            const selectedIds = getSelectedProductIds();
            const selectedInCategory = categoryProductIds.filter((id) =>
              selectedIds.includes(id),
            ).length;
            const allSelectedInCategory =
              categoryProductIds.length > 0 &&
              selectedInCategory === categoryProductIds.length;
            const someSelectedInCategory =
              selectedInCategory > 0 &&
              selectedInCategory < categoryProductIds.length;

            return (
              <Card
                key={category.id}
                className={cn(
                  "bg-card",
                  category.isVirtual &&
                    "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20",
                )}
              >
                <CardHeader className="p-3 md:pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {categoryProducts.length > 0 && (
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
                      <span className="text-xl font-bold text-card-foreground flex items-center gap-2">
                        {category.isVirtual && (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
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
                      className={cn(
                        "bg-secondary text-secondary-foreground",
                        category.isVirtual &&
                          "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {categoryProducts.length} productos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-1 pt-0 md:p-6 md:pt-0">
                  <Droppable droppableId={category.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-[100px] rounded-lg border-2 border-dashed transition-colors",
                          snapshot.isDraggingOver
                            ? "border-primary bg-primary/5"
                            : category.isVirtual
                              ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10"
                              : "border-border bg-muted/20",
                        )}
                      >
                        <div className="grid gap-1 md:gap-4 p-1 md:p-4">
                          {categoryProducts
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((product, index) => {
                              const totalStock = getTotalStock(product);
                              const multiVariant = isMultiVariant(product);

                              return (
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
                                        `bg-gradient-to-br from-background border border-border rounded-lg p-2 md:p-4 transition-all ${
                                          !product.visible
                                            ? "from-red-600/10 to-red-900/10"
                                            : totalStock > 0
                                              ? "to-background"
                                              : "from-slate-400/10 to-slate-600/10"
                                        }`,
                                        snapshot.isDragging &&
                                          "shadow-lg rotate-2 scale-105",
                                        isProductSelected(product.productId) &&
                                          "border border-slate-300 bg-primary/5",
                                      )}
                                    >
                                      <div className="flex items-center gap-1 md:gap-4">
                                        <Checkbox
                                          checked={isProductSelected(
                                            product.productId,
                                          )}
                                          onCheckedChange={() =>
                                            toggleProductSelection(
                                              product.productId,
                                              product.image,
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <h4 className="text-slate-700 hidden md:flex">
                                          {(product.order ?? 0) < 9999
                                            ? (product.order ?? 0) + 1
                                            : ""}
                                          .
                                        </h4>

                                        <div className="cursor-pointer hover:opacity-80 transition-opacity">
                                          <Image
                                            width={300}
                                            height={200}
                                            src={
                                              product.product_variants.find(
                                                (v) => v.image,
                                              )?.image || logoApp
                                            }
                                            alt={product.title || "Producto"}
                                            className="w-16 h-16 object-cover rounded-md border border-border aspect-square"
                                            style={{
                                              filter:
                                                !product.visible ||
                                                totalStock === 0
                                                  ? "grayscale(1)"
                                                  : "initial",
                                            }}
                                          />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <h3 className="font-semibold text-foreground line-clamp-1 max-w-[40dvw] md:w-auto cursor-pointer">
                                                {product.title || "Sin título"}
                                              </h3>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl flex flex-col gap-0 justify-center items-center bg-transparent w-fit p-0 border-none">
                                              <DialogHeader>
                                                <DialogTitle />
                                                <DialogDescription />
                                              </DialogHeader>
                                              <Image
                                                width={300}
                                                height={200}
                                                src={
                                                  product.product_variants.find(
                                                    (v) => v.image,
                                                  )?.image || logoApp
                                                }
                                                alt={
                                                  product.title || "Producto"
                                                }
                                                className="w-[300dvw/4] md:w-[100dvw/2] h-auto object-cover rounded-lg aspect-square"
                                              />
                                            </DialogContent>
                                          </Dialog>

                                          <p className="text-sm text-muted-foreground">
                                            {product.creado
                                              ? format(
                                                  new Date(product.creado),
                                                  "short",
                                                )
                                              : "N/A"}
                                          </p>

                                          {/* PRECIO desde variantes */}
                                          <ProductPriceLabel
                                            product={product}
                                            webshop={webshop}
                                          />

                                          {/* Badge variantes en móvil */}
                                          {multiVariant && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                              {getVariantSummary(product)}
                                            </p>
                                          )}
                                        </div>

                                        {/* Controls desktop */}
                                        <div className="gap-3 hidden md:flex items-start">
                                          {!webshop?.store?.stocks && (
                                            <>
                                              {!multiVariant ? (
                                                // Simple: un solo switch
                                                <div className="flex flex-col items-center gap-2">
                                                  <Switch
                                                    checked={totalStock > 0}
                                                    onCheckedChange={() =>
                                                      toggleSimpleStock(
                                                        product.productId,
                                                      )
                                                    }
                                                  />
                                                  <span className="text-sm text-muted-foreground">
                                                    {totalStock > 0
                                                      ? "En Stock"
                                                      : "Agotado"}
                                                  </span>
                                                </div>
                                              ) : null}
                                            </>
                                          )}
                                          {/* Visible toggle — siempre */}
                                          <div className="flex flex-col-reverse items-center gap-2">
                                            <Switch
                                              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800"
                                              checked={!!product.visible}
                                              onCheckedChange={() =>
                                                toggleProductStatus(
                                                  product.productId,
                                                  "visible",
                                                )
                                              }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                              {product.visible
                                                ? "Visible"
                                                : "Oculto"}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Badges desktop */}
                                        <div className="hidden md:flex flex-col-reverse gap-1">
                                          <StockBadge
                                            product={product}
                                            webshop={webshop}
                                          />
                                          {!product.visible ? (
                                            <Badge
                                              variant="default"
                                              className="text-xs"
                                            >
                                              <EyeOff className="w-3 h-3 mr-1" />{" "}
                                              Oculto
                                            </Badge>
                                          ) : (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              <Eye className="w-3 h-3 mr-1" />{" "}
                                              Visible
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Dropdown */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="size-8 px-2"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {/* Stock mobile — solo simple */}
                                            {!webshop?.store?.stocks &&
                                              !multiVariant && (
                                                <DropdownMenuItem className="flex items-center justify-between gap-2 md:hidden">
                                                  <span className="text-sm">
                                                    {totalStock > 0
                                                      ? "En Stock"
                                                      : "Agotado"}
                                                  </span>
                                                  <Switch
                                                    checked={totalStock > 0}
                                                    onCheckedChange={() =>
                                                      toggleSimpleStock(
                                                        product.productId,
                                                      )
                                                    }
                                                  />
                                                </DropdownMenuItem>
                                              )}
                                            <DropdownMenuItem className="flex items-center justify-between gap-2 md:hidden">
                                              <span className="text-sm">
                                                {product.visible
                                                  ? "Visible"
                                                  : "Oculto"}
                                              </span>
                                              <Switch
                                                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800"
                                                checked={!!product.visible}
                                                onCheckedChange={() =>
                                                  toggleProductStatus(
                                                    product.productId,
                                                    "visible",
                                                  )
                                                }
                                              />
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                              <Link
                                                href={`/products/${product.productId}`}
                                              >
                                                <Edit className="size-4 mr-2" />{" "}
                                                Editar producto
                                              </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                              <Link
                                                href={`/products/${product.productId}`}
                                              >
                                                <Eye className="size-4 mr-2" />{" "}
                                                Ver en tienda
                                              </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-destructive gap-2"
                                              onClick={async () =>
                                                await deleteProduct([
                                                  {
                                                    productId:
                                                      product.productId,
                                                    image: product.image,
                                                  },
                                                ])
                                              }
                                            >
                                              {downloading ? (
                                                <Loader2 className="size-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="size-4" />
                                              )}
                                              Eliminar
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                          {provided.placeholder}
                          {categoryProducts.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              {category.isVirtual
                                ? "No hay productos sin categoría"
                                : "Arrastra productos aquí o agrega nuevos"}
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
          disabled={downloading}
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${downloading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Guardar
        </Button>
      </div>
      <ConfirmationOut
        action={hasPendingChanges(products, webshop?.products || [])}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const reorder = (list, startIndex, endIndex) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function OrderProducts(productos, categorias, startIndex, endIndex, specific) {
  const productosOrdenados = {};
  categorias.forEach((cat) => {
    productosOrdenados[cat] = [];
  });

  productos.forEach((producto) => {
    const cat = producto.caja || UNCATEGORIZED_ID;
    if (productosOrdenados[cat]) {
      productosOrdenados[cat].push(producto);
    } else {
      if (!productosOrdenados[UNCATEGORIZED_ID])
        productosOrdenados[UNCATEGORIZED_ID] = [];
      productosOrdenados[UNCATEGORIZED_ID].push(producto);
    }
  });

  if (specific && specific !== "none") {
    const enCategoria = productos.filter(
      (p) => (p.caja || UNCATEGORIZED_ID) === specific,
    );
    if (enCategoria.length > 0) {
      productosOrdenados[specific] = reorder(enCategoria, startIndex, endIndex);
    }
  }

  const sin_category = productos.filter(
    (p) => !categorias.includes(p.caja || UNCATEGORIZED_ID),
  );
  return [...asignarOrden(productosOrdenados), ...sin_category];
}

const asignarOrden = (productos) => {
  const result = [];
  Object.keys(productos).forEach((cat) => {
    if (Array.isArray(productos[cat])) {
      result.push(...productos[cat].map((p, i) => ({ ...p, order: i })));
    }
  });
  return result;
};

const hasPendingChanges = (data, store) =>
  JSON.stringify(data) !== JSON.stringify(store);

// obtenerProductosModificados — comparar también product_variants
const obtenerProductosModificados = (originales, nuevos) => {
  const map = Object.fromEntries(originales.map((p) => [p.productId, p]));
  return nuevos.filter((nuevo) => {
    const orig = map[nuevo.productId];
    if (!orig) return false;

    const stockCambio = orig.stock !== nuevo.stock;
    const ordenCambio = orig.order !== nuevo.order;
    const visibleCambio = orig.visible !== nuevo.visible;
    const cajaCambio = orig.caja !== nuevo.caja;

    // Comparar stocks de cada variante
    const variantStockCambio = (nuevo.product_variants ?? []).some((nv) => {
      const ov = (orig.product_variants ?? []).find((v) => v.id === nv.id);
      return ov && Number(ov.stock) !== Number(nv.stock);
    });

    return (
      stockCambio ||
      ordenCambio ||
      visibleCambio ||
      cajaCambio ||
      variantStockCambio
    );
  });
};
// ─── Switch de stock por variante (multi-variante, modo sin stocks) ────────────
function VariantStockSwitches({ product, onToggle }) {
  const real = product?.product_variants;
  // Si por alguna razón no hay variantes reales, no renderizar
  if (real.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      {real.map((v) => {
        const enStock = (Number(v.stock) || 0) > 0;
        const label =
          v.attributes?.color ??
          v.attributes?.peso ??
          v.attributes?.talla ??
          v.label ??
          v.id.slice(0, 6);
        return (
          <div key={v.id} className="flex items-center gap-1.5">
            <Switch
              checked={enStock}
              onCheckedChange={() => onToggle(product.productId, v.id)}
              className="scale-75 origin-left"
            />
            <span className="text-[11px] text-muted-foreground truncate max-w-[56px]">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React, { useState, useContext, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  AlertTriangle,
  GripVertical,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import { useRouter } from "next/navigation";
import { format } from "@formkit/tempo";
import Image from "next/image";
import axios from "axios";
import { sileo } from "sileo";
import Link from "next/link";
import ConfimationOut from "@/components/globalFunction/confimationOut";
import { motion, AnimatePresence } from "framer-motion";

const UNCATEGORIZED_ID = "uncategorized";

export function ProductManagementSystem() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    setProducts(webshop?.products || []);
  }, [webshop?.products]);

  // ── Datos derivados (lógica sin cambios) ──────────────────────────────────

  const uncategorizedProducts = React.useMemo(() => {
    const validIds = webshop?.store?.categoria?.map((c) => c.id) || [];
    return products.filter(
      (p) =>
        !p.caja || p.caja === UNCATEGORIZED_ID || !validIds.includes(p.caja),
    );
  }, [products, webshop?.store?.categoria]);

  const allCategories = React.useMemo(() => {
    const cats = [...(webshop?.store?.categoria || [])];
    if (uncategorizedProducts.length > 0)
      cats.push({
        id: UNCATEGORIZED_ID,
        name: "Sin categoría",
        isVirtual: true,
      });
    return cats;
  }, [webshop?.store?.categoria, uncategorizedProducts]);

  const getCategoryProducts = React.useCallback(
    (categoryId) => {
      if (categoryId === UNCATEGORIZED_ID) return uncategorizedProducts;
      return products.filter((p) => p.caja === categoryId);
    },
    [products, uncategorizedProducts],
  );

  // ── Lógica de selección (sin cambios) ────────────────────────────────────

  const getSelectedProductIds = () => selectedProducts.map((s) => s.productId);
  const isProductSelected = (id) =>
    selectedProducts.some((s) => s.productId === id);
  const clearSelection = () => setSelectedProducts([]);

  const toggleProductSelection = (productId, image) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((s) => s.productId === productId);
      return exists
        ? prev.filter((s) => s.productId !== productId)
        : [...prev, { productId, image }];
    });
  };

  const toggleSelectAllInCategory = (categoryId) => {
    const catProds = getCategoryProducts(categoryId).map((p) => ({
      productId: p.productId,
      image: p.image,
    }));
    const catIds = catProds.map((p) => p.productId);
    const selIds = getSelectedProductIds();
    const allSel = catIds.every((id) => selIds.includes(id));
    setSelectedProducts((prev) =>
      allSel
        ? prev.filter((s) => !catIds.includes(s.productId))
        : [
            ...prev,
            ...catProds.filter(
              (p) => !prev.some((s) => s.productId === p.productId),
            ),
          ],
    );
  };

  const toggleProductStatus = (productId, field) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, [field]: !p[field] } : p,
      ),
    );
  };

  // ── DnD ──────────────────────────────────────────────────────────────────

  const DragAndDrop = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const { droppableId: srcCat, index: srcIdx } = source;
    const { droppableId: dstCat, index: dstIdx } = destination;
    if (srcCat === dstCat) {
      setProducts((prev) =>
        OrderProducts(
          prev,
          allCategories.map((c) => c.id),
          srcIdx,
          dstIdx,
          srcCat,
        ),
      );
    } else {
      setProducts((prev) => {
        const updated = prev.map((p) =>
          p.productId === draggableId
            ? {
                ...p,
                caja: dstCat === UNCATEGORIZED_ID ? null : dstCat,
                order: dstIdx,
              }
            : p,
        );
        return OrderProducts(
          updated,
          allCategories.map((c) => c.id),
          srcIdx,
          dstIdx,
          dstCat,
        );
      });
    }
  };

  // ── API (sin cambios) ─────────────────────────────────────────────────────

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
    const deletePromise = axios.delete(
      `/api/tienda/${webshop?.store?.sitioweb}/products/`,
      { data: formData },
    );
    try {
      await sileo.promise(deletePromise, {
        loading: { title: "Eliminando productos..." },
        success: (response) => {
          const ids = value.map((s) => s.productId);
          setWebshop((prev) => ({
            ...prev,
            products: prev.products.filter((p) => !ids.includes(p.productId)),
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
    if (!modified || !modified.length) {
      setDownloading(false);
      sileo.info({
        title: "Sin cambios",
        description: "No se detectaron modificaciones.",
      });
      return;
    }
    const formData = new FormData();
    formData.append("products", JSON.stringify(modified));
    const putPromise = axios.put(
      `/api/tienda/${webshop?.store?.sitioweb}/products`,
      formData,
    );
    try {
      await sileo.promise(putPromise, {
        loading: { title: "Guardando cambios..." },
        success: () => {
          setWebshop((prev) => ({ ...prev, products }));
          const c = modified.length;
          return {
            title: `${c} producto${c !== 1 ? "s" : ""} actualizado${c !== 1 ? "s" : ""}`,
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
  const hasPending = hasPendingChanges(products, webshop?.products || []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Barra de selección masiva — sticky */}
      <AnimatePresence>
        {totalSelected > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-4 z-20 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-sm"
          >
            <span className="text-sm font-medium text-primary">
              {totalSelected} producto{totalSelected !== 1 ? "s" : ""}{" "}
              seleccionado{totalSelected !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
              >
                <X size={12} />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors">
                    <Trash2 size={12} />
                    <span className="hidden sm:inline">Eliminar</span>
                    <span className="sm:hidden">{totalSelected}</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ¿Eliminar {totalSelected} producto
                      {totalSelected !== 1 ? "s" : ""}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteProduct(selectedProducts)}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categorías con drag & drop */}
      <DragDropContext onDragEnd={DragAndDrop}>
        <div className="space-y-4">
          {allCategories.map((category) => {
            const catProds = getCategoryProducts(category.id);
            const catIds = catProds.map((p) => p.productId);
            const selIds = getSelectedProductIds();
            const selInCat = catIds.filter((id) => selIds.includes(id)).length;
            const allSelInCat = catIds.length > 0 && selInCat === catIds.length;
            const someSelInCat = selInCat > 0 && selInCat < catIds.length;

            return (
              <div
                key={category.id}
                className={cn(
                  "border rounded-xl overflow-hidden",
                  category.isVirtual ? "border-amber-400/40" : "border-border",
                )}
              >
                {/* Header de categoría */}
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-3 border-b",
                    category.isVirtual
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-400/30"
                      : "bg-secondary/30 border-border",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {catProds.length > 0 && (
                      <Checkbox
                        checked={allSelInCat}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelInCat;
                        }}
                        onCheckedChange={() =>
                          toggleSelectAllInCategory(category.id)
                        }
                      />
                    )}
                    {category.isVirtual && (
                      <AlertTriangle
                        size={14}
                        className="text-amber-500 shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {category.name}
                    </span>
                    {selInCat > 0 && (
                      <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        {selInCat} sel.
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      category.isVirtual
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {catProds.length} productos
                  </span>
                </div>

                {/* Zona droppable */}
                <Droppable droppableId={category.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[80px] transition-colors p-2 space-y-1.5",
                        snapshot.isDraggingOver
                          ? "bg-primary/5"
                          : "bg-background",
                      )}
                    >
                      {catProds
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
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
                                className={cn(
                                  "flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border transition-all",
                                  snapshot.isDragging
                                    ? "shadow-lg border-primary/30 rotate-1 scale-[1.02] bg-background"
                                    : "border-border bg-background hover:border-border/80",
                                  isProductSelected(product.productId) &&
                                    "border-primary/40 bg-primary/5",
                                  !product.visible && "opacity-60",
                                )}
                              >
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab touch-none"
                                >
                                  <GripVertical size={14} />
                                </div>

                                {/* Checkbox */}
                                <Checkbox
                                  checked={isProductSelected(product.productId)}
                                  onCheckedChange={() =>
                                    toggleProductSelection(
                                      product.productId,
                                      product.image,
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0"
                                />

                                {/* Número orden — solo sm+ */}
                                <span className="hidden sm:block text-[11px] text-muted-foreground/60 w-5 text-right shrink-0 tabular-nums">
                                  {(product.order ?? 0) < 9999
                                    ? (product.order ?? 0) + 1
                                    : ""}
                                </span>

                                {/* Imagen con preview en Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <div className="shrink-0 cursor-pointer">
                                      <Image
                                        width={56}
                                        height={56}
                                        src={product.image || logoApp}
                                        alt={product.title || "Producto"}
                                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-border"
                                        style={{
                                          filter:
                                            !product.stock || !product.visible
                                              ? "grayscale(1)"
                                              : "none",
                                        }}
                                      />
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-sm flex flex-col items-center gap-0 bg-transparent border-none p-0">
                                    <DialogHeader>
                                      <DialogTitle />
                                      <DialogDescription />
                                    </DialogHeader>
                                    <Image
                                      width={400}
                                      height={400}
                                      src={product.image || logoApp}
                                      alt={product.title || "Producto"}
                                      className="w-full h-auto object-cover rounded-xl aspect-square"
                                    />
                                  </DialogContent>
                                </Dialog>

                                {/* Info del producto */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {product.title || "Sin título"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.creado
                                      ? format(
                                          new Date(product.creado),
                                          "short",
                                        )
                                      : "N/A"}
                                  </p>
                                  <p className="text-xs font-medium text-primary tabular-nums">
                                    {(product.price || 0).toFixed(2)}{" "}
                                    {webshop?.store?.monedas?.find(
                                      (c) => c.id === product?.default_moneda,
                                    )?.nombre ??
                                      webshop?.store?.monedas?.find(
                                        (c) => c.defecto,
                                      )?.nombre ??
                                      ""}
                                  </p>
                                </div>

                                {/* Badges estado — ocultos en mobile, visibles sm+ */}
                                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                                  {product.stock ? (
                                    webshop?.store?.stocks ? (
                                      <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                                        {product.stock} u.
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                        En stock
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                                      Agotado
                                    </span>
                                  )}
                                  {!product.visible ? (
                                    <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <EyeOff size={9} />
                                      Oculto
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Eye size={9} />
                                      Visible
                                    </span>
                                  )}
                                </div>

                                {/* Switches — solo en md+ */}
                                <div className="hidden md:flex items-center gap-3 shrink-0">
                                  {!webshop?.store?.stocks && (
                                    <div className="flex flex-col items-center gap-1">
                                      <Switch
                                        checked={!!product.stock}
                                        onCheckedChange={() =>
                                          setProducts((prev) =>
                                            prev.map((p) =>
                                              p.productId === product.productId
                                                ? {
                                                    ...product,
                                                    stock: product.stock
                                                      ? 0
                                                      : 1,
                                                  }
                                                : p,
                                            ),
                                          )
                                        }
                                      />
                                      <span className="text-[10px] text-muted-foreground">
                                        {product.stock ? "Stock" : "Agotado"}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex flex-col items-center gap-1">
                                    <Switch
                                      checked={!!product.visible}
                                      onCheckedChange={() =>
                                        toggleProductStatus(
                                          product.productId,
                                          "visible",
                                        )
                                      }
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                      {product.visible ? "Visible" : "Oculto"}
                                    </span>
                                  </div>
                                </div>

                                {/* Menú contextual */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0">
                                      <MoreVertical size={14} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    {/* Switches en mobile dentro del menú */}
                                    {!webshop?.store?.stocks && (
                                      <DropdownMenuItem
                                        className="flex items-center justify-between gap-2 md:hidden"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <span className="text-sm">
                                          {product.stock
                                            ? "En stock"
                                            : "Agotado"}
                                        </span>
                                        <Switch
                                          checked={!!product.stock}
                                          onCheckedChange={() =>
                                            setProducts((prev) =>
                                              prev.map((p) =>
                                                p.productId ===
                                                product.productId
                                                  ? {
                                                      ...product,
                                                      stock: product.stock
                                                        ? 0
                                                        : 1,
                                                    }
                                                  : p,
                                              ),
                                            )
                                          }
                                        />
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="flex items-center justify-between gap-2 md:hidden"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <span className="text-sm">
                                        {product.visible ? "Visible" : "Oculto"}
                                      </span>
                                      <Switch
                                        checked={!!product.visible}
                                        onCheckedChange={() =>
                                          toggleProductStatus(
                                            product.productId,
                                            "visible",
                                          )
                                        }
                                      />
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="md:hidden" />
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/products/${product.productId}`}
                                        className="gap-2"
                                      >
                                        <Edit size={13} /> Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/products/${product.productId}`}
                                        className="gap-2"
                                      >
                                        <Eye size={13} /> Ver en tienda
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive gap-2 focus:text-destructive"
                                      onClick={() =>
                                        deleteProduct([
                                          {
                                            productId: product.productId,
                                            image: product.image,
                                          },
                                        ])
                                      }
                                    >
                                      {downloading ? (
                                        <>
                                          <Loader2
                                            size={13}
                                            className="animate-spin"
                                          />{" "}
                                          Eliminando
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 size={13} /> Eliminar
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </Draggable>
                        ))}

                      {provided.placeholder}

                      {catProds.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                          <Package size={20} className="opacity-40" />
                          <p className="text-xs">
                            {category.isVirtual
                              ? "Sin productos sin categoría"
                              : "Arrastra productos aquí"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Botón guardar sticky */}
      {hasPending && (
        <div className="sticky bottom-4 flex justify-center">
          <motion.button
            onClick={SaveData}
            disabled={downloading}
            whileHover={{ scale: downloading ? 1 : 1.02 }}
            whileTap={{ scale: downloading ? 1 : 0.98 }}
            className={cn(
              "flex items-center gap-2 text-sm px-10 py-3 rounded-xl font-medium shadow-lg transition-all",
              downloading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {downloading && <Loader2 size={14} className="animate-spin" />}
            {downloading ? "Guardando..." : "Guardar cambios"}
          </motion.button>
        </div>
      )}

      <ConfimationOut
        action={hasPendingChanges(products, webshop?.products || [])}
      />
    </div>
  );
}

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────

const reorder = (list, startIndex, endIndex) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function OrderProducts(productos, categorias, startIndex, endIndex, specific) {
  if (!Array.isArray(productos) || !Array.isArray(categorias))
    return productos || [];
  const ordenados = {};
  categorias.forEach((cat) => {
    ordenados[cat] = [];
  });
  productos.forEach((prod) => {
    const catId = prod.caja || UNCATEGORIZED_ID;
    if (ordenados[catId]) ordenados[catId].push(prod);
    else {
      if (!ordenados[UNCATEGORIZED_ID]) ordenados[UNCATEGORIZED_ID] = [];
      ordenados[UNCATEGORIZED_ID].push(prod);
    }
  });
  if (specific && specific !== "none") {
    const inCat = productos.filter(
      (p) => (p.caja || UNCATEGORIZED_ID) === specific,
    );
    if (inCat.length > 0)
      ordenados[specific] = reorder(inCat, startIndex, endIndex);
  }
  const sinCat = productos.filter(
    (p) => !categorias.includes(p.caja || UNCATEGORIZED_ID),
  );
  return [...asignarOrden(ordenados), ...sinCat];
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

const obtenerProductosModificados = (originales, nuevos) => {
  if (!Array.isArray(originales) || !Array.isArray(nuevos)) return [];
  const map = Object.fromEntries(originales.map((p) => [p.productId, p]));
  return nuevos.filter((n) => {
    const o = map[n.productId];
    return (
      o &&
      (o.stock !== n.stock ||
        o.order !== n.order ||
        o.visible !== n.visible ||
        o.caja !== n.caja)
    );
  });
};

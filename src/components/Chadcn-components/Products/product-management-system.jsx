"use client";

import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers"; // ← FIX 4: nuevo import
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
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
import { format } from "@formkit/tempo";
import Image from "next/image";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import Link from "next/link";
import ConfirmationOut from "@/components/globalFunction/confirmationOut";
import {
  getDisplayPrice,
  getMaxPrice,
  getTotalStock,
  isMultiVariant,
  getVariantSummary,
} from "@/utils/variants";

const UNCATEGORIZED_ID = "uncategorized";

// ─── Price display helper ─────────────────────────────────────────────────────
function ProductPriceLabel({ product, webshop }) {
  const moneda =
    webshop?.store?.monedas?.find((c) => c.id === product?.default_moneda) ??
    webshop?.store?.monedas?.find((c) => c.defecto);
  const monedaNombre = moneda?.nombre ?? "";
  const min = getDisplayPrice(product);
  const max = getMaxPrice(product);
  const multi = isMultiVariant(product) && min !== max;
  if (min === 0 && max === 0)
    return (
      <p className="text-sm text-muted-foreground">Sin precio configurado</p>
    );
  return (
    <p className="text-sm text-primary">
      {multi ? "desde " : ""}${min.toFixed(2)}
      {multi && max > 0 && ` – $${max.toFixed(2)}`}
      {monedaNombre && ` ${monedaNombre}`}
    </p>
  );
}

// ─── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ product, webshop }) {
  const total = getTotalStock(product);
  const summary = getVariantSummary(product);
  if (summary)
    return (
      <Badge variant="outline" className="text-xs font-normal">
        {summary}
      </Badge>
    );
  if (total > 0)
    return webshop?.store?.stocks ? (
      <Badge variant="outline" className="text-xs">
        {total} unidades
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        En stock
      </Badge>
    );
  return (
    <Badge variant="destructive" className="text-xs">
      Agotado
    </Badge>
  );
}

// ─── Overlay liviano — solo imagen + título, sin portals pesados ──────────────
function DragOverlayCard({ product }) {
  const totalStock = getTotalStock(product);
  return (
    <div className="bg-background border border-primary shadow-2xl rounded-lg p-3 flex items-center gap-3 rotate-2 scale-110 opacity-100 pointer-events-none">
      <GripVertical className="w-5 h-5 text-primary shrink-0 animate-pulse" />
      <Image
        width={48}
        height={48}
        src={product.product_variants?.find((v) => v.image)?.image || logoApp}
        alt={product.title || "Producto"}
        className="w-12 h-12 object-cover rounded-md border-2 border-primary aspect-square"
        style={{
          filter:
            !product.visible || totalStock === 0 ? "grayscale(1)" : "initial",
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground line-clamp-1 text-sm">
          {product.title || "Sin título"}
        </p>
        <ProductPriceLabel product={product} webshop={null} />
      </div>
    </div>
  );
}

// ─── ProductCard — React.memo evita re-renders innecesarios ──────────────────
const ProductCard = React.memo(function ProductCard({
  product,
  webshop,
  isSelected,
  onToggleSelection,
  onToggleStatus,
  onToggleSimpleStock,
  onDelete,
  downloading,
}) {
  const totalStock = getTotalStock(product);
  const multiVariant = isMultiVariant(product);

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-background border border-border rounded-lg p-2 md:p-4 transition-all",
        !product.visible
          ? "from-red-600/10 to-red-900/10"
          : totalStock > 0
            ? "to-background"
            : "from-slate-400/10 to-slate-600/10",
        isSelected && "border-slate-300 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-1 md:gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() =>
            onToggleSelection(product.productId, product.image)
          }
          onClick={(e) => e.stopPropagation()}
        />
        <h4 className="text-slate-700 hidden md:flex">
          {(product.order ?? 0) < 9999 ? (product.order ?? 0) + 1 : ""}.
        </h4>

        <Image
          width={300}
          height={200}
          src={product.product_variants?.find((v) => v.image)?.image || logoApp}
          alt={product.title || "Producto"}
          className="w-16 h-16 object-cover rounded-md border border-border aspect-square"
          style={{
            filter:
              !product.visible || totalStock === 0 ? "grayscale(1)" : "initial",
          }}
        />

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
                  product.product_variants?.find((v) => v.image)?.image ||
                  logoApp
                }
                alt={product.title || "Producto"}
                className="w-[300dvw/4] md:w-[100dvw/2] h-auto object-cover rounded-lg aspect-square"
              />
            </DialogContent>
          </Dialog>
          <p className="text-sm text-muted-foreground">
            {product.creado ? format(new Date(product.creado), "short") : "N/A"}
          </p>
          <ProductPriceLabel product={product} webshop={webshop} />
          {multiVariant && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {getVariantSummary(product)}
            </p>
          )}
        </div>

        {/* Controles desktop */}
        <div className="gap-3 hidden md:flex items-start">
          {!webshop?.store?.stocks && !multiVariant && (
            <div className="flex flex-col items-center gap-2">
              <Switch
                checked={totalStock > 0}
                onCheckedChange={() => onToggleSimpleStock(product.productId)}
              />
              <span className="text-sm text-muted-foreground">
                {totalStock > 0 ? "En Stock" : "Agotado"}
              </span>
            </div>
          )}
          <div className="flex flex-col-reverse items-center gap-2">
            <Switch
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800"
              checked={!!product.visible}
              onCheckedChange={() =>
                onToggleStatus(product.productId, "visible")
              }
            />
            <span className="text-sm text-muted-foreground">
              {product.visible ? "Visible" : "Oculto"}
            </span>
          </div>
        </div>

        {/* Badges desktop */}
        <div className="hidden md:flex flex-col-reverse gap-1">
          <StockBadge product={product} webshop={webshop} />
          {!product.visible ? (
            <Badge variant="default" className="text-xs">
              <EyeOff className="w-3 h-3 mr-1" /> Oculto
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <Eye className="w-3 h-3 mr-1" /> Visible
            </Badge>
          )}
        </div>

        {/* Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-8 px-2">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!webshop?.store?.stocks && !multiVariant && (
              <DropdownMenuItem className="flex items-center justify-between gap-2 md:hidden">
                <span className="text-sm">
                  {totalStock > 0 ? "En Stock" : "Agotado"}
                </span>
                <Switch
                  checked={totalStock > 0}
                  onCheckedChange={() => onToggleSimpleStock(product.productId)}
                />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="flex items-center justify-between gap-2 md:hidden">
              <span className="text-sm">
                {product.visible ? "Visible" : "Oculto"}
              </span>
              <Switch
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800"
                checked={!!product.visible}
                onCheckedChange={() =>
                  onToggleStatus(product.productId, "visible")
                }
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.productId}`}>
                <Edit className="size-4 mr-2" /> Editar producto
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.productId}`}>
                <Eye className="size-4 mr-2" /> Ver en tienda
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive gap-2"
              onClick={async () =>
                await onDelete([
                  { productId: product.productId, image: product.image },
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
  );
});

// ─── FIX PRINCIPAL: SortableProductItem con handle inline (no absolute) ───────
// El handle como elemento flex evita que se superponga sobre Checkbox/Switch.
// Los listeners solo están en el GripVertical, no en toda la tarjeta.
const SortableProductItem = React.memo(function SortableProductItem({
  product,
  ...cardProps
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.productId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group", isDragging && "opacity-50")}
    >
      {/* ← Handle como flex item, no position:absolute */}
      <div className="flex items-stretch gap-0">
        {/* Handle — solo este nodo captura el drag */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center justify-center px-2 shrink-0",
            "cursor-grab active:cursor-grabbing",
            "touch-none select-none", // esencial para móvil
            "rounded-l-lg hover:bg-primary/10 transition-colors duration-200",
          )}
          title="Arrastra para reordenar"
        >
          <GripVertical
            className="text-muted-foreground group-hover:text-primary transition-colors size-5 md:size-4"
            strokeWidth={2.5}
          />
        </div>

        {/* Tarjeta — ya no necesita padding-left compensatorio */}
        <div className="flex-1 min-w-0">
          <ProductCard product={product} {...cardProps} />
        </div>
      </div>
    </div>
  );
});

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProductManagementSystem() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);

  // ─── FIX 1 + 2: Sensores corregidos ────────────────────────────────────────
  // PointerSensor distance 10 (era 8): evita activación accidental en clicks.
  // TouchSensor delay 250ms (era 100ms): da tiempo al navegador para distinguir
  // scroll nativo de drag. tolerance 8 (era 5): más margen para dedos gruesos.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
  );

  useEffect(() => {
    setProducts(webshop?.products || []);
  }, [webshop?.products]);
  // Set para O(1) lookups
  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map((s) => s.productId)),
    [selectedProducts],
  );

  const uncategorizedProducts = useMemo(() => {
    const validIds = new Set(webshop?.store?.categoria?.map((c) => c.id) ?? []);
    return products.filter(
      (p) => !p.caja || p.caja === UNCATEGORIZED_ID || !validIds.has(p.caja),
    );
  }, [products, webshop?.store?.categoria]);

  const allCategories = useMemo(() => {
    const cats = [...(webshop?.store?.categoria || [])];
    if (uncategorizedProducts.length > 0)
      cats.push({
        id: UNCATEGORIZED_ID,
        name: "Sin categoría",
        isVirtual: true,
      });
    return cats;
  }, [webshop?.store?.categoria, uncategorizedProducts]);

  // Map de productos por categoría — evita filtrar el array completo
  const productsByCategory = useMemo(() => {
    const map = new Map(allCategories.map((c) => [c.id, []]));
    for (const p of products) {
      const key =
        !p.caja || p.caja === UNCATEGORIZED_ID || !map.has(p.caja)
          ? UNCATEGORIZED_ID
          : p.caja;
      map.get(key)?.push(p);
    }
    for (const arr of map.values())
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return map;
  }, [products, allCategories]);

  const getCategoryProducts = useCallback(
    (categoryId) => productsByCategory.get(categoryId) ?? [],
    [productsByCategory],
  );

  // ─── Drag ─────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    ({ active }) =>
      setActiveProduct(products.find((p) => p.productId === active.id) ?? null),
    [products],
  );

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveProduct(null);
    if (!over || active.id === over.id) return;
    setProducts((prev) => {
      const activeIdx = prev.findIndex((p) => p.productId === active.id);
      const overIdx = prev.findIndex((p) => p.productId === over.id);
      if (activeIdx === -1 || overIdx === -1) return prev;
      const newCaja = prev[overIdx]?.caja ?? null;
      const cajaChanged = prev[activeIdx].caja !== newCaja;
      const updated = cajaChanged
        ? prev.map((p) =>
            p.productId === active.id ? { ...p, caja: newCaja } : p,
          )
        : prev;
      const reordered = arrayMove(updated, activeIdx, overIdx);
      const counters = {};
      return reordered.map((p) => {
        const key = p.caja || UNCATEGORIZED_ID;
        counters[key] = counters[key] ?? 0;
        return { ...p, order: counters[key]++ };
      });
    });
  }, []);

  const handleDragCancel = useCallback(() => setActiveProduct(null), []);

  // ─── Toggles ──────────────────────────────────────────────────────────────
  const toggleProductStatus = useCallback((productId, field) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, [field]: !p[field] } : p,
      ),
    );
  }, []);

  const toggleSimpleStock = useCallback((productId) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.productId !== productId) return prod;
        if (isMultiVariant(prod)) return prod;
        const newStock = getTotalStock(prod) > 0 ? 0 : 1;
        const updatedVariants = (prod.product_variants ?? []).map((v) =>
          v.attributes?.es_default ? { ...v, stock: newStock } : v,
        );
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
  }, []);

  // ─── Selección ────────────────────────────────────────────────────────────
  const isProductSelected = useCallback(
    (productId) => selectedProductIds.has(productId),
    [selectedProductIds],
  );

  const toggleProductSelection = useCallback((productId, image) => {
    setSelectedProducts((prev) =>
      prev.some((s) => s.productId === productId)
        ? prev.filter((s) => s.productId !== productId)
        : [...prev, { productId, image }],
    );
  }, []);

  const toggleSelectAllInCategory = useCallback(
    (categoryId) => {
      const catProds = getCategoryProducts(categoryId);
      const catIds = catProds.map((p) => p.productId);
      const allSelected = catIds.every((id) => selectedProductIds.has(id));
      setSelectedProducts((prev) => {
        if (allSelected)
          return prev.filter((s) => !catIds.includes(s.productId));
        const existing = new Set(prev.map((s) => s.productId));
        const toAdd = catProds
          .filter((p) => !existing.has(p.productId))
          .map((p) => ({ productId: p.productId, image: p.image }));
        return [...prev, ...toAdd];
      });
    },
    [getCategoryProducts, selectedProductIds],
  );

  const clearSelection = useCallback(() => setSelectedProducts([]), []);

  // ─── API ──────────────────────────────────────────────────────────────────
  const deleteProduct = useCallback(
    async (value) => {
      setDownloading(true);
      if (!value?.length) {
        setDownloading(false);
        toast.error("No hay productos para eliminar");
        return;
      }
      const formData = new FormData();
      formData.append("values", JSON.stringify(value));
      try {
        await toast.promise(
          apiClient.delete(
            `/api/tienda/${webshop?.store?.sitioweb}/products/`,
            { data: formData },
          ),
          {
            loading: "Eliminando productos...",
            success: (response) => {
              const ids = new Set(value.map((s) => s.productId));
              setWebshop((prev) => ({
                ...prev,
                products: prev.products.filter((p) => !ids.has(p.productId)),
              }));
              setSelectedProducts([]);
              return response?.data?.message ?? "Productos eliminados";
            },
            error: (err) =>
              err?.response?.data?.message ??
              err?.message ??
              "Error al eliminar",
          },
        );
      } catch (err) {
        console.error(err);
      } finally {
        setDownloading(false);
      }
    },
    [webshop?.store?.sitioweb, setWebshop],
  );

  const SaveData = useCallback(async () => {
    setDownloading(true);
    const modified = obtenerProductosModificados(
      webshop?.products || [],
      products,
    );
    if (!modified.length) {
      setDownloading(false);
      toast.info("No hay cambios para guardar");
      return;
    }
    const formData = new FormData();
    formData.append("products", JSON.stringify(modified));
    try {
      await toast.promise(
        apiClient.put(
          `/api/tienda/${webshop?.store?.sitioweb}/products`,
          formData,
        ),
        {
          loading: "Guardando cambios...",
          success: () => {
            setWebshop((prev) => ({ ...prev, products }));
            const n = modified.length;
            return `${n} producto${n === 1 ? "" : "s"} actualizado${n === 1 ? "" : "s"}`;
          },
          error: (err) =>
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo actualizar",
        },
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }, [webshop?.products, webshop?.store?.sitioweb, products, setWebshop]);

  const totalSelected = selectedProducts.length;

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

      {/* ─── FIX 4: modifiers={[restrictToWindowEdges]} evita que el overlay
           vuele fuera del viewport al arrastrar rápido en móvil ───────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-3 md:gap-6">
          {allCategories.map((category) => {
            const categoryProducts = getCategoryProducts(category.id);
            const categoryProductIds = categoryProducts.map((p) => p.productId);
            const selectedInCategory = categoryProductIds.filter((id) =>
              selectedProductIds.has(id),
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
                  <SortableContext
                    items={categoryProductIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className={cn(
                        "min-h-[100px] rounded-lg border-2 border-dashed transition-all duration-200",
                        "md:p-4 p-2",
                        category.isVirtual
                          ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                          : "border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50",
                      )}
                    >
                      <div className="grid gap-1 md:gap-4">
                        {categoryProducts.map((product) => (
                          <SortableProductItem
                            key={product.productId}
                            product={product}
                            webshop={webshop}
                            isSelected={isProductSelected(product.productId)}
                            onToggleSelection={toggleProductSelection}
                            onToggleStatus={toggleProductStatus}
                            onToggleSimpleStock={toggleSimpleStock}
                            onDelete={deleteProduct}
                            downloading={downloading}
                          />
                        ))}
                        {categoryProducts.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            {category.isVirtual
                              ? "No hay productos sin categoría"
                              : "Arrastra productos aquí o agrega nuevos"}
                          </div>
                        )}
                      </div>
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeProduct ? <DragOverlayCard product={activeProduct} /> : null}
        </DragOverlay>
      </DndContext>

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
const hasPendingChanges = (data, store) =>
  JSON.stringify(data) !== JSON.stringify(store);

const obtenerProductosModificados = (originales, nuevos) => {
  const map = Object.fromEntries(originales.map((p) => [p.productId, p]));
  return nuevos.filter((nuevo) => {
    const orig = map[nuevo.productId];
    if (!orig) return false;
    const variantStockCambio = (nuevo.product_variants ?? []).some((nv) => {
      const ov = (orig.product_variants ?? []).find((v) => v.id === nv.id);
      return ov && Number(ov.stock) !== Number(nv.stock);
    });
    return (
      orig.stock !== nuevo.stock ||
      orig.order !== nuevo.order ||
      orig.visible !== nuevo.visible ||
      orig.caja !== nuevo.caja ||
      variantStockCambio
    );
  });
};

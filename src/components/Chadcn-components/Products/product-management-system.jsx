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
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  AlertTriangle,
  CalendarClock,
  GripVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
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
import { logoAdmin } from "@/utils/image";
import { format } from "@formkit/tempo";
import AppImage from "@/components/ui/AppImage";
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
const CONTAINER_PREFIX = "container-"; // namespace para ids droppable de categoría

// Ajusta estas rutas a las de tu app
const ROUTES = {
  categories: "/category",
  newProduct: "/products/new",
  importProducts: "/products/import",
};

// ─── Helpers de presentación ──────────────────────────────────────────────────
function formatPrice(product, webshop) {
  const moneda =
    webshop?.store?.monedas?.find((c) => c.id === product?.default_moneda) ??
    webshop?.store?.monedas?.find((c) => c.defecto);
  const monedaNombre = moneda?.nombre ?? "";
  const min = getDisplayPrice(product);
  const max = getMaxPrice(product);
  if (min === 0 && max === 0) return null;
  const multi = isMultiVariant(product) && min !== max;
  return `${multi ? "desde " : ""}$${min.toFixed(2)}${
    multi && max > 0 ? ` – $${max.toFixed(2)}` : ""
  }${monedaNombre ? ` ${monedaNombre}` : ""}`;
}

function getStockText(product, webshop) {
  const summary = getVariantSummary(product);
  if (summary) return summary;
  const total = getTotalStock(product);
  if (total > 0)
    return webshop?.store?.stocks ? `${total} unidades` : "En stock";
  return "Agotado";
}

function getPublicationInfo(product) {
  const scheduledAt = product.publish_at ? new Date(product.publish_at) : null;
  const isScheduled =
    product.visible &&
    scheduledAt &&
    !Number.isNaN(scheduledAt.getTime()) &&
    scheduledAt > new Date();
  if (isScheduled) return { type: "scheduled", scheduledAt };
  if (!product.visible) return { type: "hidden", scheduledAt: null };
  return { type: "published", scheduledAt: null };
}

// ─── Price display helper ─────────────────────────────────────────────────────
function ProductPriceLabel({ product, webshop }) {
  const text = formatPrice(product, webshop);
  if (!text)
    return (
      <p className="text-sm text-muted-foreground">Sin precio configurado</p>
    );
  return <p className="text-sm text-primary">{text}</p>;
}

function PublicationBadge({ product }) {
  const info = getPublicationInfo(product);

  if (info.type === "scheduled") {
    return (
      <Badge
        variant="outline"
        className="text-xs border-amber-300 text-amber-700"
      >
        <CalendarClock className="w-3 h-3 mr-1" />
        Programado {info.scheduledAt.toLocaleDateString("es-ES")}
      </Badge>
    );
  }

  if (info.type === "hidden") {
    return (
      <Badge variant="default" className="text-xs">
        <EyeOff className="w-3 h-3 mr-1" /> No publicado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      <Eye className="w-3 h-3 mr-1" /> Publicado
    </Badge>
  );
}

// Estado en la fila: punto de color + texto (el texto se oculta en móvil)
const STATE_DOT = {
  scheduled: "bg-amber-500",
  hidden: "bg-slate-400",
  published: "bg-emerald-500",
};

function PublicationState({ product }) {
  const info = getPublicationInfo(product);
  const label =
    info.type === "scheduled"
      ? `Programado ${info.scheduledAt.toLocaleDateString("es-ES")}`
      : info.type === "hidden"
        ? "No publicado"
        : "Publicado";
  return (
    <div
      className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"
      title={label}
    >
      <span className={cn("size-2 rounded-full", STATE_DOT[info.type])} />
      <span className="hidden whitespace-nowrap md:inline">{label}</span>
    </div>
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
      <AppImage
        key={`${product.productId}-${product.product_variants?.find((v) => v.image)?.image || ""}`}
        width={48}
        height={48}
        src={[product.product_variants?.find((v) => v.image)?.image, logoAdmin]}
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

function AddCategoryLink() {
  return (
    <Link
      href={ROUTES.categories}
      className="flex items-center h-20 md:h-40 justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-sm font-medium text-primary transition-colors hover:border-primary/60 hover:bg-primary/10"
    >
      <Plus className="size-4" />
      Nueva categoría
    </Link>
  );
}

// ─── Zona droppable: ahora envuelve TODA la categoría (cabecera + filas) ──────
// Así se puede soltar un producto en categorías vacías y también en categorías
// colapsadas (queda al final de esa categoría).
const CategoryDropZone = React.memo(function CategoryDropZone({
  categoryId,
  className,
  children,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${CONTAINER_PREFIX}${categoryId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && "border-primary bg-primary/10 ring-2 ring-primary/40",
      )}
    >
      {children}
    </div>
  );
});

// ─── Vista previa (se abre desde los 3 puntos) ────────────────────────────────
// Contiene las mismas opciones que tenía el DropdownMenu.
function ProductPreviewDialog({
  product,
  webshop,
  downloading,
  onClose,
  onToggleStatus,
  onToggleSimpleStock,
  onDelete,
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  if (!product) return null;

  const totalStock = getTotalStock(product);
  const multiVariant = isMultiVariant(product);
  const image = product.product_variants?.find((v) => v.image)?.image;
  const priceText = formatPrice(product, webshop) ?? "Sin precio configurado";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-[90dvw] gap-0 overflow-y-auto p-0 sm:max-w-3xl md:grid md:grid-cols-2">
        <div className="bg-muted">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
            <AppImage
              key={`${product.productId}-${image || ""}`}
              width={600}
              height={600}
              src={[image, logoAdmin]}
              alt={product.title || "Producto"}
              className="aspect-square h-full w-full object-cover"
              style={{
                filter:
                  !product.visible || totalStock === 0
                    ? "grayscale(1)"
                    : "initial",
              }}
            />
            <Badge className="absolute top-2 left-2 text-sm bg-white text-muted-foreground">
              {product.creado
                ? format(new Date(product.creado), "short")
                : "N/A"}
              {multiVariant && ` · ${getVariantSummary(product)}`}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 md:p-6">
          <DialogHeader className="flex space-y-1 text-left">
            <DialogTitle className="text-xl">
              {product.title || "Sin título"}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-primary">
              {priceText}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <PublicationBadge product={product} />
            <StockBadge product={product} webshop={webshop} />
          </div>

          <div className="space-y-3 rounded-xl border border-border p-3">
            {!webshop?.store?.stocks && !multiVariant && (
              <label className="flex items-center justify-between gap-2 text-sm">
                <span>{totalStock > 0 ? "En Stock" : "Agotado"}</span>
                <Switch
                  checked={totalStock > 0}
                  onCheckedChange={() => onToggleSimpleStock(product.productId)}
                />
              </label>
            )}
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>{product.visible ? "Visible" : "Oculto"}</span>
              <Switch
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800"
                checked={!!product.visible}
                onCheckedChange={() =>
                  onToggleStatus(product.productId, "visible")
                }
              />
            </label>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <Button asChild>
              <Link href={`/products/${product.productId}`}>
                <Edit className="mr-2 size-4" /> Editar producto
              </Link>
            </Button>

            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={downloading}
              onClick={() => {
                setDeleteConfirmation("");
                setDeleteDialogOpen(true);
              }}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Eliminar
            </Button>
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteConfirmation("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente este producto. No se puede
              deshacer.
            </AlertDialogDescription>
            <div className="mt-4 space-y-2">
              <label
                htmlFor="delete-preview-confirmation"
                className="text-sm font-medium text-foreground"
              >
                Escribe <strong>ELIMINAR</strong> para confirmar
              </label>
              <input
                id="delete-preview-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteConfirmation.trim().toUpperCase() !== "ELIMINAR" ||
                downloading
              }
              onClick={() => {
                onDelete([
                  { productId: product.productId, image: product.image },
                ]);
                setDeleteDialogOpen(false);
                onClose();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {downloading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// ─── ProductCard (contenido de la fila) — React.memo evita re-renders ────────
const ProductCard = React.memo(function ProductCard({
  product,
  webshop,
  isSelected,
  onToggleSelection,
  onToggleStatus,
  onOpenPreview,
}) {
  const totalStock = getTotalStock(product);
  const soldOut = !getVariantSummary(product) && totalStock === 0;
  const priceText = formatPrice(product, webshop) ?? "Sin precio configurado";
  const dateText = product.creado
    ? format(new Date(product.creado), "short")
    : "N/A";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 py-2.5 md:gap-3">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() =>
          onToggleSelection(product.productId, product.image)
        }
      />

      <AppImage
        key={`${product.productId}-${product.product_variants?.find((v) => v.image)?.image || ""}`}
        width={100}
        height={100}
        src={[product.product_variants?.find((v) => v.image)?.image, logoAdmin]}
        alt={product.title || "Producto"}
        className=" size-12 shrink-0 rounded-lg border border-border object-cover aspect-square md:size-14"
        style={{
          filter:
            !product.visible || totalStock === 0 ? "grayscale(1)" : "initial",
        }}
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate max-w-[6rem] md:max-w-full font-semibold text-foreground">
          {product.title || "Sin título"}
        </h3>
        <p className="truncate text-xs text-muted-foreground md:text-sm">
          {dateText} · {priceText}
        </p>
        <p
          className={cn(
            "truncate text-[11px] text-muted-foreground",
            soldOut && "text-destructive",
          )}
        >
          {getStockText(product, webshop)}
        </p>
      </div>

      <PublicationState product={product} />

      <Switch
        className="hidden data-[state=checked]:bg-primary data-[state=unchecked]:bg-red-800 md:inline-flex"
        checked={!!product.visible}
        onCheckedChange={() => onToggleStatus(product.productId, "visible")}
        aria-label={`Cambiar visibilidad de ${product.title || "producto"}`}
      />

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={() => onOpenPreview(product.productId)}
        aria-label={`Más opciones para ${product.title || "producto"}`}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
});

// ─── SortableProductItem: fila con handle de arrastre a la izquierda ─────────
const SortableProductItem = React.memo(function SortableProductItem({
  product,
  isSelected,
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
      className={cn(
        "group flex items-stretch gap-1 rounded-xl border border-border bg-background pr-2 transition-colors hover:bg-muted/40 md:pr-3",
        isSelected && "border-primary/40 bg-primary/5",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex shrink-0 items-center justify-center px-1.5 md:px-2",
          "cursor-grab active:cursor-grabbing",
          "touch-none select-none",
          "rounded-l-xl hover:bg-primary/10 transition-colors duration-200",
        )}
        title="Arrastra para reordenar"
      >
        <GripVertical
          className="text-muted-foreground group-hover:text-primary transition-colors size-5 md:size-4"
          strokeWidth={2.5}
        />
      </div>

      <ProductCard product={product} isSelected={isSelected} {...cardProps} />
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState("");

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

  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map((s) => s.productId)),
    [selectedProducts],
  );

  // El producto de la vista previa se deriva del estado: los switches del
  // diálogo se actualizan en vivo y, si el producto se elimina, el diálogo se cierra solo.
  const previewProduct = useMemo(
    () => products.find((p) => p.productId === previewId) ?? null,
    [products, previewId],
  );
  const closePreview = useCallback(() => setPreviewId(null), []);

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

  // Productos de una categoría (filtrados por la búsqueda si hay una activa)
  const normalizedSearch = search.trim().toLowerCase();
  const getCategoryProducts = useCallback(
    (categoryId) => {
      const list = productsByCategory.get(categoryId) ?? [];
      if (!normalizedSearch) return list;
      return list.filter((p) =>
        (p.title ?? "").toLowerCase().includes(normalizedSearch),
      );
    },
    [productsByCategory, normalizedSearch],
  );

  // Con búsqueda activa solo se muestran las categorías con coincidencias
  const visibleCategories = useMemo(
    () =>
      normalizedSearch
        ? allCategories.filter((c) => getCategoryProducts(c.id).length > 0)
        : allCategories,
    [allCategories, normalizedSearch, getCategoryProducts],
  );

  // ─── Colapsar / expandir ──────────────────────────────────────────────────
  const toggleCollapsed = useCallback((categoryId) => {
    setCollapsed((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }, []);

  const allCollapsed =
    allCategories.length > 0 && allCategories.every((c) => collapsed[c.id]);

  const toggleAllCategories = useCallback(() => {
    setCollapsed(
      allCollapsed
        ? {}
        : Object.fromEntries(allCategories.map((c) => [c.id, true])),
    );
  }, [allCollapsed, allCategories]);

  // ─── Drag ─────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    ({ active }) =>
      setActiveProduct(products.find((p) => p.productId === active.id) ?? null),
    [products],
  );

  // Distingue entre soltar sobre otro producto (reordenar) y soltar sobre el
  // contenedor de una categoría (mover ahí: vacía, colapsada o el espacio libre).
  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (downloading) return;
      setActiveProduct(null);
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      const overIsContainer =
        typeof overId === "string" && overId.startsWith(CONTAINER_PREFIX);

      if (!overIsContainer && activeId === overId) return;

      setProducts((prev) => {
        const activeIdx = prev.findIndex((p) => p.productId === activeId);
        if (activeIdx === -1) return prev;

        let newCaja;
        let reordered;

        if (overIsContainer) {
          // Soltado directamente sobre el contenedor de una categoría
          newCaja = overId.slice(CONTAINER_PREFIX.length);
          const cajaChanged = prev[activeIdx].caja !== newCaja;
          const updated = cajaChanged
            ? prev.map((p) =>
                p.productId === activeId ? { ...p, caja: newCaja } : p,
              )
            : prev;
          // Lo movemos al final del array (quedará último en su categoría)
          const idx = updated.findIndex((p) => p.productId === activeId);
          const item = updated[idx];
          reordered = [
            ...updated.slice(0, idx),
            ...updated.slice(idx + 1),
            item,
          ];
        } else {
          // Soltado sobre otro producto: comportamiento original
          const overIdx = prev.findIndex((p) => p.productId === overId);
          if (overIdx === -1) return prev;
          newCaja = prev[overIdx]?.caja ?? null;
          const cajaChanged = prev[activeIdx].caja !== newCaja;
          const updated = cajaChanged
            ? prev.map((p) =>
                p.productId === activeId ? { ...p, caja: newCaja } : p,
              )
            : prev;
          reordered = arrayMove(updated, activeIdx, overIdx);
        }

        const counters = {};
        return reordered.map((p) => {
          const key = p.caja || UNCATEGORIZED_ID;
          counters[key] = counters[key] ?? 0;
          return { ...p, order: counters[key]++ };
        });
      });
    },
    [downloading],
  );

  const handleDragCancel = useCallback(() => setActiveProduct(null), []);

  // ─── Toggles ──────────────────────────────────────────────────────────────
  const toggleProductStatus = useCallback(
    (productId, field) => {
      if (downloading) return;
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === productId ? { ...p, [field]: !p[field] } : p,
        ),
      );
    },
    [downloading],
  );

  const toggleSimpleStock = useCallback(
    (productId) => {
      if (downloading) return;
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
    },
    [downloading],
  );

  // ─── Selección ────────────────────────────────────────────────────────────
  const isProductSelected = useCallback(
    (productId) => selectedProductIds.has(productId),
    [selectedProductIds],
  );

  const toggleProductSelection = useCallback(
    (productId, image) => {
      if (downloading) return;
      setSelectedProducts((prev) =>
        prev.some((s) => s.productId === productId)
          ? prev.filter((s) => s.productId !== productId)
          : [...prev, { productId, image }],
      );
    },
    [downloading],
  );

  const toggleSelectAllInCategory = useCallback(
    (categoryId) => {
      if (downloading) return;
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
    [downloading, getCategoryProducts, selectedProductIds],
  );

  const clearSelection = useCallback(() => setSelectedProducts([]), []);

  const openDeleteDialog = useCallback(() => {
    if (downloading || selectedProducts.length === 0) return;
    setDeleteConfirmation("");
    setDeleteDialogOpen(true);
  }, [downloading, selectedProducts.length]);

  const closeDeleteDialog = useCallback((open) => {
    setDeleteDialogOpen(open);
    if (!open) setDeleteConfirmation("");
  }, []);

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

  const confirmSelectedDeletion = useCallback(() => {
    if (deleteConfirmation.trim().toUpperCase() !== "ELIMINAR") return;
    setDeleteDialogOpen(false);
    deleteProduct(selectedProducts);
  }, [deleteConfirmation, deleteProduct, selectedProducts]);

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
  const realCategoriesCount = webshop?.store?.categoria?.length ?? 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Encabezado de página ─────────────────────────────────────────── */}

      {/* ── Resumen + búsqueda + colapsar todo ───────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">
            {products.length} producto{products.length !== 1 ? "s" : ""}
          </strong>{" "}
          · {realCategoriesCount} categoría
          {realCategoriesCount !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllCategories}
            className="shrink-0"
          >
            {allCollapsed ? (
              <ChevronsUpDown className="size-4 md:mr-2" />
            ) : (
              <ChevronsDownUp className="size-4 md:mr-2" />
            )}
            <span className="hidden md:inline">
              {allCollapsed ? "Expandir todo" : "Colapsar todo"}
            </span>
          </Button>
        </div>
      </div>

      {/* ── Barra de selección (eliminar seleccionados) ──────────────────── */}
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
                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={closeDeleteDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={downloading}
                      onClick={openDeleteDialog}
                    >
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
                      <div className="mt-4 space-y-2">
                        <label
                          htmlFor="delete-products-confirmation"
                          className="text-sm font-medium text-foreground"
                        >
                          Escribe <strong>ELIMINAR</strong> para confirmar
                        </label>
                        <input
                          id="delete-products-confirmation"
                          value={deleteConfirmation}
                          onChange={(event) =>
                            setDeleteConfirmation(event.target.value)
                          }
                          autoComplete="off"
                          autoFocus
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                        />
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmSelectedDeletion}
                        disabled={
                          deleteConfirmation.trim().toUpperCase() !==
                            "ELIMINAR" || downloading
                        }
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

      {/* ── Catálogo por categorías ──────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-3 md:gap-4">
          {normalizedSearch && visibleCategories.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No se encontraron productos para “{search.trim()}”
            </div>
          )}

          {visibleCategories.map((category) => {
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
            // Con búsqueda activa siempre se expande para mostrar coincidencias
            const isCollapsed = !normalizedSearch && !!collapsed[category.id];

            return (
              <CategoryDropZone
                key={category.id}
                categoryId={category.id}
                className={cn(
                  "rounded-2xl border bg-card transition-all duration-200",
                  category.isVirtual
                    ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-border",
                )}
              >
                {/* Cabecera de la categoría */}
                <div className="flex items-center gap-2 p-3 md:gap-3 md:px-4">
                  {categoryProducts.length > 0 && (
                    <Checkbox
                      checked={allSelectedInCategory}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelectedInCategory;
                      }}
                      onCheckedChange={() =>
                        toggleSelectAllInCategory(category.id)
                      }
                      aria-label={`Seleccionar todos los productos de ${category.name}`}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => toggleCollapsed(category.id)}
                    aria-expanded={!isCollapsed}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    {category.isVirtual && (
                      <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    )}
                    <span className="truncate text-lg font-bold text-card-foreground">
                      {category.name}
                    </span>
                  </button>

                  {selectedInCategory > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {selectedInCategory} seleccionado
                      {selectedInCategory !== 1 ? "s" : ""}
                    </Badge>
                  )}
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
                </div>

                {/* Filas (se ocultan al colapsar) */}
                {!isCollapsed && (
                  <SortableContext
                    items={categoryProductIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-1.5 border-t border-border p-2 md:gap-2 md:p-3">
                      {categoryProducts.map((product) => (
                        <SortableProductItem
                          key={product.productId}
                          product={product}
                          webshop={webshop}
                          isSelected={isProductSelected(product.productId)}
                          onToggleSelection={toggleProductSelection}
                          onToggleStatus={toggleProductStatus}
                          onOpenPreview={setPreviewId}
                        />
                      ))}
                      {categoryProducts.length === 0 && (
                        <div className="flex min-h-[90px] items-center justify-center rounded-xl border-2 border-dashed border-border text-center text-sm text-muted-foreground">
                          {category.isVirtual
                            ? "No hay productos sin categoría"
                            : "Arrastra productos aquí o agrega nuevos"}
                        </div>
                      )}
                    </div>
                  </SortableContext>
                )}
              </CategoryDropZone>
            );
          })}
        </div>

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeProduct ? <DragOverlayCard product={activeProduct} /> : null}
        </DragOverlay>
      </DndContext>

      <AddCategoryLink />

      <div className="backdrop-blur-sm p-2 flex justify-center sticky bottom-0">
        <Button
          onClick={SaveData}
          disabled={downloading}
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${downloading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Guardar
        </Button>
      </div>

      <ProductPreviewDialog
        product={previewProduct}
        webshop={webshop}
        downloading={downloading}
        onClose={closePreview}
        onToggleStatus={toggleProductStatus}
        onToggleSimpleStock={toggleSimpleStock}
        onDelete={deleteProduct}
      />

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

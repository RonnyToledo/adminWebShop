"use client";

import React, { useContext, useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmationOut from "../../globalFunction/confirmationOut";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreHorizontal,
  Trash2,
  Search,
  Plus,
  Edit,
  Package,
  GripVertical,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";

export default function Category({ ThemeContext, initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [add, setAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCat, setNewCat] = useState({});
  const [data, setData] = useState({
    category: initialData?.store?.categoria ?? [],
    UUID: initialData?.store?.UUID ?? "",
  });
  const form = useRef(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    if (!initialData?.store) return;

    setData({
      category: initialData.store.categoria ?? [],
      UUID: initialData.store.UUID ?? "",
    });
    setWebshop((previous) => ({
      ...previous,
      store: { ...previous.store, ...initialData.store },
      products: initialData.products ?? previous.products,
      store_role: initialData.store_role ?? previous.store_role,
    }));
  }, [initialData, setWebshop]);

  useEffect(() => {
    if (webshop?.store?.categoria) {
      setData({
        category: webshop?.store?.categoria,
        UUID: webshop?.store?.UUID,
      });
    }
  }, [webshop]);

  useEffect(() => {
    setFilteredCategories(
      searchTerm === ""
        ? data.category
        : data.category.filter((obj) =>
            obj.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
    );
  }, [searchTerm, data.category]);

  const handleDelete = async (categoryToDelete, image) => {
    setDeleting(true);
    if (!categoryToDelete) {
      toast.error("No se recibió el UUID de la categoría.");
      setDeleting(false);
      return;
    }
    const deletePromise = apiClient.delete(
      `/api/tienda/${webshop?.store?.sitioweb}/categoria`,
      { data: { UUID: categoryToDelete, image } },
    );
    try {
      await toast.promise(deletePromise, {
        loading: "Eliminando categoría...",
        success: (response) => {
          setWebshop((prev) => ({
            ...prev,
            store: {
              ...prev.store,
              categoria: (
                prev.store.categoria ??
                prev.store.categorias ??
                []
              ).filter((item) => item.id !== categoryToDelete),
            },
          }));
          router.refresh();
          return response?.data?.message ?? "Categoría eliminada correctamente";
        },
        error: (err) =>
          err?.response?.data?.message ?? err?.message ?? "Error al eliminar",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setDownloading(true);
    if (!webshop?.store?.sitioweb) {
      toast.error("Faltó 'sitioweb'.");
      setDownloading(false);
      return;
    }
    const formData = new FormData();
    formData.append("categoria", JSON.stringify(data?.category ?? []));
    formData.append("UUID", String(data?.UUID ?? ""));
    const putPromise = apiClient.put(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      formData,
    );
    try {
      await toast.promise(putPromise, {
        loading: "Guardando categorías...",
        success: (response) => {
          const returned =
            response?.data?.data ?? response?.data ?? data.category;
          setWebshop((prev) => ({
            ...prev,
            store: { ...prev.store, categoria: returned },
          }));
          router.refresh();
          return "Categorías actualizadas";
        },
        error: (err) =>
          err?.response?.data?.message ?? err?.message ?? "Error al guardar",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const addCategory = async () => {
    setAdd(true);
    if (!newCat?.name?.trim()) {
      toast.error("Debes indicar el nombre.");
      form.current?.reset();
      setAdd(false);
      return;
    }
    const payload = {
      ...newCat,
      storeId: webshop.store.UUID,
      order: data?.category?.length ?? 0,
    };
    const postPromise = apiClient.post(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      payload,
      { headers: { "Content-Type": "application/json" } },
    );
    try {
      await toast.promise(postPromise, {
        loading: "Creando categoría...",
        success: (response) => {
          const created = response?.data?.data ?? response?.data ?? null;
          const cat = created || { ...payload, id: `temp-${Date.now()}` };
          setWebshop((prev) => ({
            ...prev,
            store: {
              ...prev.store,
              categoria: [...(prev.store.categoria ?? []), cat],
            },
          }));
          router.refresh();
          setNewCat({});
          form.current?.reset();
          return "Categoría creada";
        },
        error: (err) =>
          err?.response?.data?.message ?? err?.message ?? "Error al crear",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAdd(false);
      setNewCat({});
      setIsAddDialogOpen(false);
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setData((prev) => {
      const oldIndex = prev.category.findIndex((c) => c.id === active.id);
      const newIndex = prev.category.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev.category, oldIndex, newIndex).map(
        (obj, ind) => ({ ...obj, order: ind }),
      );
      return { ...prev, category: reordered };
    });
  };

  const hasPending =
    JSON.stringify(data.category) !== JSON.stringify(webshop?.store?.categoria);

  return (
    <main className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Catálogo
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.category.length} categorías ·{" "}
            {data.category.filter((c) => c.subtienda).length} subtiendas ·{" "}
            {data.category.filter((c) => c.premium).length} premium
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/premium-clientes"
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-colors font-medium"
          >
            <Crown size={14} /> Clientes Premium
          </Link>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button
                disabled={add || downloading || deleting}
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                {add ? "Agregando..." : "Nueva categoría"}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva categoría</DialogTitle>
                <DialogDescription>
                  Crea una nueva categoría para organizar tus productos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
                    Nombre
                  </Label>
                  <Input
                    value={newCat.name || ""}
                    onChange={(e) =>
                      setNewCat({ ...newCat, name: e.target.value })
                    }
                    placeholder="Ej: Bebidas"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
                    Descripción (opcional)
                  </Label>
                  <Textarea
                    value={newCat.description || ""}
                    onChange={(e) =>
                      setNewCat({ ...newCat, description: e.target.value })
                    }
                    placeholder="Describe brevemente..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
                  <Label className="text-sm">Subtienda</Label>
                  <Switch
                    checked={!!newCat.subtienda}
                    onCheckedChange={(v) =>
                      setNewCat({ ...newCat, subtienda: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div>
                    <Label className="text-sm flex items-center gap-1.5">
                      <Crown size={13} className="text-amber-500" /> Premium
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Solo visible para clientes Premium
                    </p>
                  </div>
                  <Switch
                    checked={!!newCat.premium}
                    onCheckedChange={(v) =>
                      setNewCat({ ...newCat, premium: v })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-sm px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCategory}
                  disabled={add || downloading || deleting}
                  className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {add ? "Creando..." : "Crear"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Lista arrastrable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <SortableContext
            items={filteredCategories
              .sort((a, b) => a.order - b.order)
              .map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              <AnimatePresence>
                {filteredCategories
                  .sort((a, b) => a.order - b.order)
                  .map((category, index) => (
                    <CategoryItem
                      key={category.id || index}
                      index={index}
                      category={category}
                      products={webshop?.products}
                      onDelete={handleDelete}
                      deleting={deleting}
                      setData={setData}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </SortableContext>

          {hasPending && (
            <div className="sticky bottom-4 flex justify-center pt-4">
              <button
                type="submit"
                disabled={downloading}
                className={`flex items-center gap-2 text-sm px-8 py-3 rounded-xl font-medium shadow-lg transition-all ${
                  downloading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {downloading && <Loader2 size={14} className="animate-spin" />}
                {downloading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}
        </form>
      </DndContext>

      <ConfirmationOut action={hasPending} />
    </main>
  );
}

// ─── CategoryItem ─────────────────────────────────────────────────────────────
const CategoryItem = ({
  index,
  category,
  products,
  onDelete,
  deleting,
  setData,
}) => {
  const productCount = (products || []).filter(
    (p) => p.caja === category.id,
  ).length;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
        isDragging
          ? "shadow-md border-primary/30"
          : category.premium
            ? "border-amber-500/30 hover:border-amber-500/50"
            : "border-border hover:border-border/80"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab shrink-0"
      >
        <GripVertical size={14} />
      </div>

      {/* Icono */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          category.premium ? "bg-amber-500/10" : "bg-primary/10"
        }`}
      >
        {category.premium ? (
          <Crown size={15} className="text-amber-500" />
        ) : (
          <Package size={15} className="text-primary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {category.name}
          </span>
          {category.subtienda && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Subtienda
            </Badge>
          )}
          {category.premium && (
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
              Premium
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {productCount} producto{productCount !== 1 ? "s" : ""}
          {category.description && ` · ${category.description}`}
        </p>
      </div>

      {/* Switches: subtienda + premium */}
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
            Subtienda
          </span>
          <Switch
            checked={!!category.subtienda}
            onCheckedChange={(v) =>
              setData((prev) => ({
                ...prev,
                category: prev.category.map((obj) =>
                  obj.id === category.id ? { ...obj, subtienda: v } : obj,
                ),
              }))
            }
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
            Premium
          </span>
          <Switch
            checked={!!category.premium}
            onCheckedChange={(v) =>
              setData((prev) => ({
                ...prev,
                category: prev.category.map((obj) =>
                  obj.id === category.id ? { ...obj, premium: v } : obj,
                ),
              }))
            }
          />
        </div>
      </div>

      {/* Menú */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/category/${category.id}`} className="gap-2">
              <Edit size={13} /> Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(category.id, category.image)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            {deleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { sileo } from "sileo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ConfimationOut from "../../globalFunction/confimationOut";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Category({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [add, setAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCat, setNewCat] = useState({});
  const [data, setData] = useState({ category: [], UUID: "" });
  const form = useRef(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);

  useEffect(() => {
    if (webshop?.store?.categoria.length > 0) {
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
      sileo.error({
        title: "Error",
        description: "No se recibió el UUID de la categoría.",
      });
      setDeleting(false);
      return;
    }
    const deletePromise = axios.delete(
      `/api/tienda/${webshop?.store?.sitioweb}/categoria`,
      { data: { UUID: categoryToDelete, image } },
    );
    try {
      sileo.promise(deletePromise, {
        loading: { title: "Eliminando categoría..." },
        success: (response) => {
          setWebshop((prev) => ({
            ...prev,
            store: {
              ...prev.store,
              categoria: prev.store.categoria.filter(
                (item) => item.id !== categoryToDelete,
              ),
            },
          }));
          return {
            title: "Categoría eliminada",
            description: response?.data?.message ?? "Eliminada correctamente",
          };
        },
        error: (err) => ({
          title: "Error",
          description:
            err?.response?.data?.message ?? err?.message ?? "Error al eliminar",
        }),
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
      sileo.error({ title: "Error", description: "Faltó 'sitioweb'." });
      setDownloading(false);
      return;
    }
    const formData = new FormData();
    formData.append("categoria", JSON.stringify(data?.category ?? []));
    formData.append("UUID", String(data?.UUID ?? ""));
    const putPromise = axios.put(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      formData,
    );
    try {
      sileo.promise(putPromise, {
        loading: { title: "Guardando categorías..." },
        success: (response) => {
          const returned =
            response?.data?.data ?? response?.data ?? data.category;
          setWebshop((prev) => ({
            ...prev,
            store: { ...prev.store, categoria: returned },
          }));
          return { title: "Categorías actualizadas" };
        },
        error: (err) => ({
          title: "Error",
          description: err?.response?.data?.message ?? err?.message,
        }),
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
      sileo.error({ title: "Error", description: "Debes indicar el nombre." });
      form.current?.reset();
      setAdd(false);
      return;
    }
    const payload = {
      ...newCat,
      storeId: webshop.store.UUID,
      order: data?.category?.length ?? 0,
    };
    const postPromise = axios.post(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      payload,
      { headers: { "Content-Type": "application/json" } },
    );
    try {
      sileo.promise(postPromise, {
        loading: { title: "Creando categoría..." },
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
          setNewCat({});
          form.current?.reset();
          return { title: "Categoría creada" };
        },
        error: (err) => ({
          title: "Error",
          description: err?.response?.data?.message ?? err?.message,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAdd(false);
      setNewCat({});
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const reordered = reorder(data.category, source.index, destination.index);
    setData((prev) => ({ ...prev, category: reordered }));
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
            {data.category.filter((c) => c.subtienda).length} subtiendas
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shrink-0">
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
                className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                {add ? "Creando..." : "Crear"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      <DragDropContext onDragEnd={onDragEnd}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Droppable droppableId={webshop?.store?.sitioweb || "unique"}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Botón guardar sticky */}
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
      </DragDropContext>

      <ConfimationOut action={hasPending} />
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

  return (
    <Draggable draggableId={`draggable-${category.id || index}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-background border border-border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
            snapshot.isDragging
              ? "shadow-md border-primary/30"
              : "hover:border-border/80"
          }`}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab shrink-0"
          >
            <GripVertical size={14} />
          </div>

          {/* Icono */}
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package size={15} className="text-primary" />
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
            </div>
            <p className="text-xs text-muted-foreground">
              {productCount} producto{productCount !== 1 ? "s" : ""}
              {category.description && ` · ${category.description}`}
            </p>
          </div>

          {/* Switch subtienda */}
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
      )}
    </Draggable>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((obj, ind) => ({ ...obj, order: ind }));
};

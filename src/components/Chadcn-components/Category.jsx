"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
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
import ConfimationOut from "../globalFunction/confimationOut";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import {
  Search,
  Plus,
  Edit,
  Package,
  DotIcon as DragHandleDots2Icon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

export default function Category({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [add, setAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCat, setNewCat] = useState({});
  const [data, setData] = useState({ category: [], UUID: "" });
  const { toast } = useToast();
  const form = useRef(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Cargar datos iniciales al montar el componente
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
      searchTerm == ""
        ? data.category
        : data.category.filter((obj) =>
            obj.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
    );
  }, [searchTerm, data.category]);

  const handleDelete = async (categoryToDelete, image) => {
    setDeleting(true);

    try {
      const res = await axios.delete(
        `/api/tienda/${webshop?.store?.sitioweb}/categoria`,
        {
          data: { UUID: categoryToDelete, image }, // El cuerpo debe ir en `data`
          headers: { "Content-Type": "application/json" }, // Usa el tipo correcto
        }
      );

      if (res.status === 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Categoria Eliminada",
          action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
        });
        const updatedCategories = data.category.filter(
          (item) => item.id !== categoryToDelete
        );
        setWebshop({
          ...webshop,
          store: { ...webshop?.store, categoria: updatedCategories },
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar las categorías.",
      });
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    formData.append("categoria", JSON.stringify(data.category));
    formData.append("UUID", data.UUID);
    try {
      const res = await axios.put(
        `/api/tienda/${webshop?.store?.sitioweb}/categoria`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.status === 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Información actualizada",
          action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
        });
        setWebshop({
          ...webshop,
          store: { ...webshop?.store, categoria: res?.data?.data },
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar las categorías.",
      });
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const addCategory = async () => {
    setAdd(true);
    if (newCat.name) {
      try {
        const res = await axios.post(
          `/api/tienda/${webshop?.store?.sitioweb}/categoria`,
          {
            data: {
              ...newCat,
              storeId: webshop?.store?.UUID,
              order: data.category.length,
            }, // El cuerpo debe ir en `data`
            headers: { "Content-Type": "application/json" }, // Usa el tipo correcto
          }
        );

        if (res.status === 200) {
          toast({
            title: "Tarea Ejecutada",
            description: "Categoria Creada",
            action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
          });
          setData((prevData) => ({
            ...prevData,
            category: [...prevData.category, res.data.data],
          }));
          setNewCat({});
        }
      } catch (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "No se pudo editar las categorías.",
        });
        console.error(error);
      } finally {
        setNewCat({});

        setAdd(false);
      }
      form.current?.reset();
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Tiene q agregar un nombre a la categoria.",
      });
      form.current?.reset();
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const reorderedCategories = reorder(
      data.category,
      source.index,
      destination.index
    );
    setData((prevData) => ({ ...prevData, category: reorderedCategories }));
  };

  return (
    <main className="py-2 px-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Categorías
          </h1>
          <p className="text-gray-600 mt-1">
            Administra las categorías de tu tienda
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {add ? "Agregando categoría..." : "Agregar Categoría"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Categoría</DialogTitle>
              <DialogDescription>
                Crea una nueva categoría para organizar tus productos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la categoría</Label>
                <Input
                  id="name"
                  value={newCat.name || ""}
                  onChange={(e) =>
                    setNewCat({ ...newCat, name: e.target.value })
                  }
                  placeholder="Ej: Maquillaje de ojos"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={newCat.description || ""}
                  onChange={(e) =>
                    setNewCat({ ...newCat, description: e.target.value })
                  }
                  placeholder="Describe brevemente esta categoría..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newCat.subtienda}
                  onCheckedChange={(checked) =>
                    setNewCat({ ...newCat, subtienda: checked })
                  }
                />
                <Label htmlFor="active">Subtienda</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={addCategory}>
                {add ? "Creando Categoría..." : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{data.category.length} categorías totales</span>
          <span>
            {data.category.filter((c) => c.subtienda).length} subtiendas
          </span>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Droppable droppableId={webshop?.store?.sitioweb || "unique"}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="gap-4 space-y-3"
              >
                {filteredCategories
                  .sort((a, b) => a.order - b.order)
                  .map((category, index) => (
                    <CategoryItem
                      key={index}
                      index={index}
                      category={category}
                      products={webshop?.products}
                      onDelete={handleDelete}
                      deleting={deleting}
                      setData={setData}
                      handleSubmit={handleSubmit}
                      downloading={downloading}
                      onUpdateProducts={(updatedProducts) =>
                        setData((prev) => ({
                          ...prev,
                          products: updatedProducts,
                        }))
                      }
                    />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="bg-white p-2 flex justify-center sticky bottom-0 w-full">
            <Button
              className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
                downloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={downloading}
              type="submit"
              id="Guardar"
            >
              {downloading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DragDropContext>
      <ConfimationOut action={hasPendingChanges(data, webshop)} />
    </main>
  );
}

const CategoryItem = ({
  index,
  category,
  products,
  onDelete,
  deleting,
  setData,
  handleSubmit,
  downloading,
}) => {
  const router = useRouter();
  return (
    <Draggable draggableId={`draggable-${index}`} index={index}>
      {(provided) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`transition-all hover:shadow-md ${
            !category.isActive ? "opacity-60" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div className="cursor-grab text-gray-400 hover:text-gray-600">
                <DragHandleDots2Icon className="w-5 h-5" />
              </div>

              {/* Category Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 " />
              </div>

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {category.name}
                  </h3>
                  {category.subtienda && (
                    <Badge variant="secondary" className="text-xs">
                      Subtienda
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {
                      products.filter((prod) => prod.caja === category.id)
                        .length
                    }{" "}
                    productos
                  </span>
                  {category.description && (
                    <span className="truncate max-w-xs">
                      {category.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <Switch
                checked={category.subtienda}
                onCheckedChange={(checked) =>
                  setData((prevState) => ({
                    ...prevState,
                    category: prevState.category.map((obj) =>
                      category.id === obj.id
                        ? { ...obj, subtienda: checked }
                        : obj
                    ),
                  }))
                }
                className="data-[state=checked]:bg-green-600"
              />

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/category/${category.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id, category.image)}
                    className="text-red-600 focus:text-red-600"
                  >
                    {!deleting ? (
                      <>
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </>
                    ) : (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Eliminando
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

// Utilidad y helpers
const hasPendingChanges = (data, webshop) => {
  return (
    JSON.stringify(data.category) !== JSON.stringify(webshop?.store?.categoria)
  );
};

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((obj, ind) => {
    return { ...obj, order: ind };
  });
};

const ordenarCategorias = (categorias, productos, campo, orden = "asc") => {
  if (!["price", "visitas"].includes(campo)) {
    throw new Error("El campo debe ser 'precio' o 'visitas'.");
  }

  // Calcular el total del campo (precio o visitas) para cada categoría
  const categoriasOrdenadas = categorias.map((categoria) => {
    const productosFiltrados = productos.filter(
      (producto) => producto.caja === categoria.id
    );

    const totalCampo = productosFiltrados.reduce(
      (total, producto) => total + (producto[campo] || 0),
      0
    );

    return {
      ...categoria,
      total: totalCampo,
    };
  });

  // Ordenar según el total del campo, en ascendente o descendente
  categoriasOrdenadas.sort((a, b) => {
    if (orden === "asc") {
      return a.total - b.total;
    } else if (orden === "desc") {
      return b.total - a.total;
    }
    return 0;
  });
  return categoriasOrdenadas.map(({ total, ...rest }) => rest);
};

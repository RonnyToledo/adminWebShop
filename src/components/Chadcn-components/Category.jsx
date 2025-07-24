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
import { Pencil, TrashIcon, FolderIcon, Loader } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ConfimationOut from "../globalFunction/confimationOut";
import { Textarea } from "../ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import { RadioGroupItem, RadioGroup } from "../ui/radio-group";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import MovingIcon from "@mui/icons-material/Moving";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

export default function Category({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [add, setAdd] = useState(false);
  const [newCat, setNewCat] = useState({});
  const [data, setData] = useState({ category: [], UUID: "" });
  const { toast } = useToast();
  const form = useRef(null);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    if (webshop.store.categoria.length > 0) {
      setData({
        category: webshop.store.categoria,
        UUID: webshop.store.UUID,
      });
    }
  }, [webshop]);

  const handleDelete = async (categoryToDelete, image) => {
    setDeleting(true);

    try {
      const res = await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/categoria`,
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
          store: { ...webshop.store, categoria: updatedCategories },
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
        `/api/tienda/${webshop.store.sitioweb}/categoria`,
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
          store: { ...webshop.store, categoria: res?.data?.data },
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

  const addCategory = async (e) => {
    e.preventDefault();
    setAdd(true);
    if (newCat.name) {
      try {
        const res = await axios.post(
          `/api/tienda/${webshop.store.sitioweb}/categoria`,
          {
            data: {
              ...newCat,
              storeId: webshop.store.UUID,
              order: data.length,
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

  // Estado para el criterio de ordenamiento
  const [sortCriteria, setSortCriteria] = useState("none");

  const handleSortChange = (criteria) => {
    setSortCriteria(criteria);

    // Crear una copia de las categorías para evitar mutaciones
    const categoriasCopia = [...data.category];
    let sortedCategories;

    switch (criteria) {
      case "price-asc":
        sortedCategories = ordenarCategorias(
          categoriasCopia,
          webshop.products,
          "price",
          "asc"
        );
        break;

      case "price-desc":
        sortedCategories = ordenarCategorias(
          categoriasCopia,
          webshop.products,
          "price",
          "desc"
        );
        break;

      case "name-asc":
        sortedCategories = categoriasCopia.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case "name-desc":
        sortedCategories = categoriasCopia.sort((a, b) =>
          b.name.localeCompare(a.name)
        );
        break;

      case "visitas-asc":
        sortedCategories = ordenarCategorias(
          categoriasCopia,
          webshop.products,
          "visitas",
          "desc" //MAyor frecuencia es de mayor a menor
        );
        break;

      case "visitas-desc":
        sortedCategories = ordenarCategorias(
          categoriasCopia,
          webshop.products,
          "visitas",
          "asc" //
        );
        break;

      case "none":
      default:
        // Restaurar el orden original basado en el campo `order`
        sortedCategories = categoriasCopia.sort((a, b) => a.order - b.order);
        break;
    }

    // Actualizar el estado con las categorías ordenadas
    setData((prevState) => ({
      ...prevState,
      category: sortedCategories.map((obj, index) => {
        return { ...obj, order: index };
      }),
    }));
  };
  return (
    <main className="py-2 px-6">
      <div className="flex items-center justify-between p-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"> Agregar Categoria</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form
              className="bg-white rounded-lg p-2 space-y-2 flex flex-col align-center"
              onSubmit={addCategory}
            >
              <DialogHeader>
                <DialogTitle>Agregar Categoria</DialogTitle>
                <DialogDescription>Crea una Categoria</DialogDescription>
              </DialogHeader>
              <div className="mt-8 mb-5 space-y-4">
                <Input
                  id="nameForCategoryNew"
                  placeholder="Ingresa el nombre de la categoría"
                  type="text"
                  value={newCat.name || ""}
                  onChange={(e) =>
                    setNewCat({ ...newCat, name: e.target.value })
                  }
                />
                <Input
                  id="descriptionForCategoryNew"
                  placeholder="Ingresa la descripcion de la categoría"
                  type="text"
                  value={newCat.description || ""}
                  onChange={(e) =>
                    setNewCat({ ...newCat, description: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={add}>
                  {!add ? "Save changes" : "Saving"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                <Label htmlFor="r2">
                  Rentabilidad Ascendente <MovingIcon className="h-4 w-4" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-desc" id="r3" />
                <Label htmlFor="r3">
                  Rentabilidad Descendente{" "}
                  <TrendingDownIcon className="h-4 w-4" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-asc" id="r4" />
                <Label htmlFor="r4">Nombre Ascendente</Label>
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
            </RadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Droppable droppableId={webshop.store.sitioweb || "unique"}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="gap-4"
              >
                {data.category
                  .sort((a, b) => a.order - b.order)
                  .map((category, index) => (
                    <CategoryItem
                      key={index}
                      index={index}
                      category={category}
                      products={webshop.products}
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
  onUpdateProducts,
  deleting,
  setData,
  handleSubmit,
  downloading,
}) => (
  <Draggable draggableId={`draggable-${index}`} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="bg-white border rounded-lg p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <FolderIcon className="h-6 w-6 text-gray-500" />
          <div>
            <h3 className="font-medium">{category.name}</h3>
            <p className="text-gray-500 text-sm">
              {products.filter((prod) => prod.caja === category.id).length}{" "}
              Productos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <div className="sr-only">Toggle menu</div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex flex-col gap-3 p-2">
                <Button variant="outline" asChild>
                  <Link
                    className="flex gap-3 w-full justify-start items-center"
                    href={`/category/${category.id}`}
                  >
                    <Pencil className=" text-gray-500" />
                    Edit
                  </Link>
                </Button>
                <Button
                  className="flex gap-3 w-full items-center"
                  variant="destructive"
                  onClick={() => onDelete(category.id, category.image)}
                >
                  {!deleting ? (
                    <Trash2 className="h-3 w-3" />
                  ) : (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Delete
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )}
  </Draggable>
);

// Utilidad y helpers
const hasPendingChanges = (data, webshop) => {
  return (
    JSON.stringify(data.category) !== JSON.stringify(webshop.store.categoria)
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

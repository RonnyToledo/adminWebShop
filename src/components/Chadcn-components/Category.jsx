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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, TrashIcon, FolderIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ConfimationOut from "../globalFunction/confimationOut";

export default function Category({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [data, setData] = useState({ category: [], products: [] });
  const { toast } = useToast();
  const form = useRef(null);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    if (webshop.store.categoria.length > 0) {
      setData({
        category: webshop.store.categoria,
        products: webshop.products,
      });
    }
  }, [webshop]);

  const handleDelete = (categoryToDelete) => {
    const updatedCategories = data.category.filter(
      (item) => item !== categoryToDelete
    );
    setWebshop({
      ...webshop,
      store: { ...webshop.store, categoria: updatedCategories },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDownloading(true);

    const updatedProducts = data.products.filter((prod) =>
      webshop.products.some(
        (item) => item.id === prod.id && item.caja !== prod.caja
      )
    );

    const formData = new FormData();
    formData.append("categoria", JSON.stringify(data.category));
    formData.append("products", JSON.stringify(updatedProducts));
    try {
      const res = await axios.post(
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
          store: { ...webshop.store, categoria: data.category },
          products: data.products,
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

  const addCategory = (e) => {
    e.preventDefault();
    setData((prevData) => ({
      ...prevData,
      category: [...prevData.category, newCat],
    }));
    setFormVisible(false);
    setNewCat("");
    form.current?.reset();
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
    <main className="py-2 px-6">
      <div className="p-4">
        {!formVisible ? (
          <Button size="sm" onClick={() => setFormVisible(!formVisible)}>
            Agregar Categoria
          </Button>
        ) : (
          <CategoryForm
            onSubmit={addCategory}
            newCat={newCat}
            setNewCat={setNewCat}
            formRef={form}
            setFormVisible={setFormVisible}
          />
        )}
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
                {data.category.map((category, index) => (
                  <CategoryItem
                    key={index}
                    index={index}
                    category={category}
                    products={data.products}
                    onDelete={handleDelete}
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
          <Button
            className={`bg-black hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloading}
          >
            {downloading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DragDropContext>
      <ConfimationOut action={hasPendingChanges(data, webshop)} />
    </main>
  );
}

const CategoryForm = ({
  onSubmit,
  newCat,
  setNewCat,
  formRef,
  setFormVisible,
}) => (
  <div className="mt-8 mb-5">
    <div className="flex justify-between">
      <h2 className="text-lg font-bold mb-4">Agregar Categoría</h2>
      <Button size="icon" variant="gosth" onClick={() => setFormVisible(false)}>
        <CloseRoundedIcon />
      </Button>
    </div>
    <form
      className="bg-white border rounded-lg p-2 space-y-2 flex flex-col align-center"
      onSubmit={onSubmit}
      ref={formRef}
    >
      <Input
        id="nameForCategoryNew"
        placeholder="Ingresa el nombre de la categoría"
        type="text"
        value={newCat}
        onChange={(e) => setNewCat(e.target.value)}
      />
      <div className="p-2 bg-white sticky buttom-0 w-full">
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  </div>
);

const CategoryItem = ({
  index,
  category,
  products,
  onDelete,
  onUpdateProducts,
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
            <h3 className="font-medium">{category}</h3>
            <p className="text-gray-500 text-sm">
              {products.filter((prod) => prod.caja === category).length}{" "}
              Productos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[300px] sm:max-w-[425px] h-2/3">
              <DialogHeader>
                <DialogTitle>Agregar Productos</DialogTitle>
                <DialogDescription>
                  Indique los productos para la categoría ({category})
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-full w-full rounded-md border p-4">
                <div className="grid gap-4 py-4">
                  {products
                    .sort((a, b) => (a.caja === category ? -1 : 1))
                    .map((prod) => (
                      <div
                        key={prod.productId}
                        className="flex justify-between items-center gap-4"
                      >
                        <Label className="text-sm font-medium">
                          {prod.title}
                        </Label>
                        <Checkbox
                          checked={prod.caja === category}
                          onCheckedChange={() =>
                            onUpdateProducts(
                              products.map((p) =>
                                p.productId === prod.productId
                                  ? {
                                      ...p,
                                      caja:
                                        p.caja === category ? null : category,
                                    }
                                  : p
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            type="button"
            onClick={() => onDelete(category)}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    )}
  </Draggable>
);

// Utilidad y helpers
const hasPendingChanges = (data, webshop) => {
  return (
    JSON.stringify(data.products) !== JSON.stringify(webshop.products) ||
    JSON.stringify(data.category) !== JSON.stringify(webshop.store.categoria)
  );
};

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

"use client";
import { Button } from "@/components/ui/button";
import { Input } from "../../ui/input";
import { ThemeContext } from "@/context/useContext";
import { useState, useContext, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import TableRowsComponentAgotados from "./table-rows-agotados";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import Fuse from "fuse.js";
import ConfimationOut from "../../globalFunction/confimationOut";
import { Search, Plus, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const options = {
  includeScore: true,
  threshold: 0.3,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ["title"],
};

export function Dashboard() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [SearchProduct, setSearchProduct] = useState("");
  const [products, setProducts] = useState([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setProducts(webshop.products);
  }, [webshop]);

  const SaveData = async () => {
    setDownloading(true);
    const formData = new FormData();
    formData.append(
      "products",
      JSON.stringify(obtenerProductosModificados(webshop.products, products))
    );

    try {
      const res = await axios.put(
        `/api/tienda/${webshop.store.sitioweb}/products`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.status == 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Informacion Actualizada",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
        setWebshop({ ...webshop, products: products });
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        title: "Error",
        variant: "destructive",

        description: "No se actualizar el producto.",
      });
    } finally {
      setDownloading(false);
    }
  };
  function SearchData() {
    const fuse = new Fuse(products, options);
    const results = fuse.search(SearchProduct);

    return results.length == 0 ? products : results.map((obj) => obj.item);
  }
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Gestión de Productos
            </h1>
            <p className="text-slate-600 mt-1">
              Organiza y administra tu catálogo de productos
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => generatePDF(webshop.products)}
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              className="gap-2 bg-slate-900 hover:bg-slate-800"
              onClick={() => router.push("/newProduct")}
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={SearchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <TableRowsComponentAgotados
            setProducts={setProducts}
            products={SearchData()}
            moveElements={SearchProduct ? true : false}
          />
        </div>
      </div>
      <div className="backdrop-blur-sm p-2 flex justify-center sticky bottom-0">
        <Button
          onClick={SaveData}
          type="submit"
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
            downloading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={downloading}
        >
          {downloading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
      <ConfimationOut action={hasPendingChanges(products, webshop.products)} />
    </div>
  );
}
const generatePDF = (products) => {
  const doc = new jsPDF();

  autoTable(doc, {
    head: [["ID", "Nombre", "Precio", "Categoria"]],
    body: products.map((product) => [
      product.id,
      product.title,
      product.price,
      product.caja,
    ]),
  });

  doc.save("productos.pdf");
};

function OrderProducts(productos, categorias) {
  const productosOrdenados = {};

  // Inicializar el objeto con categorías vacías
  categorias.forEach((categoria) => {
    productosOrdenados[categoria.name] = [];
  });

  // Llenar el objeto con productos según su categoría
  productos
    .sort((a, b) => a.order - b.order)
    .forEach((producto) => {
      if (productosOrdenados[producto.caja]) {
        productosOrdenados[producto.caja].push(producto);
      }
    });
  return asignarOrden(productosOrdenados);
}
const asignarOrden = (productos) => {
  const resultadoFinal = [];
  Object.keys(productos).forEach((categoria) => {
    resultadoFinal.push(
      ...productos[categoria].map((prod, index) => ({
        ...prod,
        order: index,
      }))
    );
  });
  return resultadoFinal;
};
// Utilidad y helpers
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
      (productoOriginal.agotado !== productoNuevo.agotado ||
        productoOriginal.order !== productoNuevo.order ||
        productoOriginal.visible !== productoNuevo.visible ||
        productoOriginal.caja !== productoNuevo.caja)
    );
  });
};

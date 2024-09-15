"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeContext } from "@/app/admin/layout";
import { useState, useContext, useEffect } from "react";
import TableRowsComponent from "./table-rows-agotados";
import { Button } from "../ui/button";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export const description =
  "An products dashboard with a sidebar navigation. The sidebar has icon navigation. The content area has a breadcrumb and search in the header. It displays a list of products in a table with actions.";

export default function ProductsOffStock() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [products, setProducts] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    setProducts([
      ...OrderProducts(webshop.products, webshop.store.categoria),
      ...webshop.products
        .sort((a, b) => a.order - b.order)
        .filter((obj) => !webshop.store.categoria.includes(obj.caja)),
    ]);
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
      }

      setWebshop({ ...webshop, products: products });
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 ">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage your products and view their sales performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Imagen</span>
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Agotado</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Categoria-Prioridad
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Precio
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Favorito
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRowsComponent
                    products={products}
                    setProducts={setProducts}
                  />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="bg-white p-2 flex justify-end sticky bottom-0 w-full">
            <Button
              className={`bg-black hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded ${
                downloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={downloading}
              onClick={SaveData}
            >
              {downloading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
function OrderProducts(productos, categorias) {
  const productosOrdenados = {};

  // Inicializar el objeto con categorías vacías
  categorias.forEach((categoria) => {
    productosOrdenados[categoria] = [];
  });

  // Llenar el objeto con productos según su categoría
  productos
    .sort((a, b) => a.order - b.order)
    .forEach((producto) => {
      if (productosOrdenados[producto.caja]) {
        productosOrdenados[producto.caja].push(producto);
      }
    });

  // Crear un array final siguiendo el orden de categorías
  const resultadoFinal = [];
  categorias.forEach((categoria) => {
    resultadoFinal.push(...productosOrdenados[categoria]);
  });

  return resultadoFinal;
}
const obtenerProductosModificados = (array1, array2) => {
  return array2.filter((producto2) => {
    const producto1 = array1.find(
      (producto) => producto.productId === producto2.productId
    );
    return producto1 && producto1.agotado !== producto2.agotado;
  });
};

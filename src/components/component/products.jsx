"use client";
import { File, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeContext } from "@/app/admin/layout";
import { useState, useContext, useRef, useEffect } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import TableRowsComponentAgotados from "./table-rows-agotados";
import TableRowsComponent from "./table-rows";
import ConfimationOut from "../globalFunction/confimationOut";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Dashboard() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [FilterAgotado, setFilterAgotado] = useState([]);
  const [FilterFavorito, setFilterFavorito] = useState([]);
  const [products, setProducts] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    setProducts(webshop.products);
    setFilterAgotado(webshop.products.filter((product) => product.agotado));
    setFilterFavorito(webshop.products.filter((product) => product.favorito));
  }, [webshop]);

  console.log(webshop.products);
  console.log(products);

  console.log(obtenerProductosModificados(webshop.products, products));
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 mt-6">
        <div className="flex items-center">
          <div className="ml-auto flex items-center gap-2 p-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => generatePDF(webshop.products)}
            >
              <File className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">Exportar PDF</span>
            </Button>
            <Link href="/admin/newProduct">
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Add Product</span>
              </Button>
            </Link>
          </div>
        </div>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="todos">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="agotado">Sin Categorias</TabsTrigger>
                <TabsTrigger value="favorito">Favoritos</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="todos">
              <TableRowsComponentAgotados
                setProducts={setProducts}
                products={products}
              />
            </TabsContent>
            <TabsContent value="agotado">
              {products.filter(
                (prod) => !webshop.store.categoria.includes(prod.caja)
              ).length > 0 ? (
                <Card x-chunk="dashboard-06-chunk-0">
                  <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagen </TableHead>

                          <TableHead>Nombre</TableHead>
                          <TableHead>Categoria-Prioridad</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Precio
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Agotado
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
                          product={products.filter(
                            (prod) =>
                              !webshop.store.categoria.includes(prod.caja)
                          )}
                        />
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div>NO hay</div>
              )}
            </TabsContent>
            <TabsContent value="favorito">
              <Card x-chunk="dashboard-06-chunk-0">
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagen </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoria-Prioridad</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Precio
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Agotado
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
                        product={OrderProducts(
                          FilterFavorito,
                          webshop.store.categoria
                        )}
                      />
                      <TableRowsComponent
                        product={FilterFavorito.sort(
                          (a, b) => a.order - b.order
                        ).filter(
                          (obj) => !webshop.store.categoria.includes(obj.caja)
                        )}
                      />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
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
        productoOriginal.caja !== productoNuevo.caja)
    );
  });
};

"use client";
import Image from "next/image";
import { File, ListFilter, MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeContext } from "@/app/admin/layout";
import { useState, useContext, useRef, useEffect } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const description =
  "An products dashboard with a sidebar navigation. The sidebar has icon navigation. The content area has a breadcrumb and search in the header. It displays a list of products in a table with actions.";
export function Dashboard() {
  const { webshop, setwebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [FilterAgotado, setFilterAgotado] = useState([]);
  const [FilterFavorito, setFilterFavorito] = useState([]);

  const deleteProduct = async (value, image) => {
    setDownloading(true);
    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("Id", value);
    try {
      const res = await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/products/${value}/`,
        {
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {
      console.error("Error :", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo eliminar el producto.",
      });
    } finally {
      toast({
        title: "Tarea Ejecutada",
        description: "Informacion Actualizada",
        action: (
          <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
        ),
      });
      setwebshop({
        ...webshop,
        products: webshop.products.filter((obj) => obj.productId !== value),
      });
      setDownloading(false);
    }
  };
  useEffect(() => {
    setFilterAgotado(webshop.products.filter((product) => product.agotado));
    setFilterFavorito(webshop.products.filter((product) => product.favorito));
  }, [webshop]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 ">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="todos">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="agotado">Agotados</TabsTrigger>
                <TabsTrigger value="favorito">Favoritos</TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => generatePDF(webshop.products)}
                >
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                  </span>
                </Button>
                <Link href="/admin/newProduct">
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Product
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
            <TabsContent value="todos">
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
                      {OrderProducts(
                        webshop.products,
                        webshop.store.categoria
                      ).map((obj, ind) => (
                        <TableRow>
                          <TableCell className="hidden sm:table-cell">
                            <Image
                              alt={obj.title ? obj.title : `Producto${ind}`}
                              className="aspect-square rounded-md object-cover"
                              height={64}
                              src={
                                obj.image
                                  ? obj.image
                                  : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                              }
                              style={{
                                aspectRatio: "64/64",
                                objectFit: "cover",
                              }}
                              width={64}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {obj.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {" "}
                              {obj.caja ? obj.caja : "Sin categoria"}{" "}
                              {obj.order < 100000
                                ? `-${obj.order}`
                                : "-Sin prioridad"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            ${Number(obj.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {obj.agotado ? "Si" : "No"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {obj.favorito ? "Si" : "No"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link
                                    href={`/admin/products/${obj.productId}`}
                                  >
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Button
                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                    size="icon"
                                    variant="ghost"
                                    disable={downloading}
                                    onClick={() =>
                                      deleteProduct(obj.productId, obj.image)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {webshop.products
                        .sort((a, b) => a.order - b.order)
                        .filter(
                          (obj) => !webshop.store.categoria.includes(obj.caja)
                        )
                        .map((obj, ind) => (
                          <TableRow>
                            <TableCell className="hidden sm:table-cell">
                              <Image
                                alt={obj.title ? obj.title : `Producto${ind}`}
                                className="aspect-square rounded-md object-cover"
                                height={64}
                                src={
                                  obj.image
                                    ? obj.image
                                    : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                                }
                                style={{
                                  aspectRatio: "64/64",
                                  objectFit: "cover",
                                }}
                                width={64}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {obj.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {" "}
                                {obj.caja ? obj.caja : "Sin categoria"}{" "}
                                {obj.order < 100000
                                  ? `-${obj.order}`
                                  : "-Sin prioridad"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              ${Number(obj.price).toFixed(2)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {obj.agotado ? "Si" : "No"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {obj.favorito ? "Si" : "No"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Link
                                      href={`/admin/products/${obj.productId}`}
                                    >
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Button
                                      className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                      size="icon"
                                      variant="ghost"
                                      disable={downloading}
                                      onClick={() =>
                                        deleteProduct(obj.productId, obj.image)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="agotado">
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
                      {OrderProducts(
                        FilterAgotado,
                        webshop.store.categoria
                      ).map((obj, ind) => (
                        <TableRow>
                          <TableCell className="hidden sm:table-cell">
                            <Image
                              alt={obj.title ? obj.title : `Producto${ind}`}
                              className="aspect-square rounded-md object-cover"
                              height={64}
                              src={
                                obj.image
                                  ? obj.image
                                  : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                              }
                              style={{
                                aspectRatio: "64/64",
                                objectFit: "cover",
                              }}
                              width={64}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {obj.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {" "}
                              {obj.caja ? obj.caja : "Sin categoria"}{" "}
                              {obj.order < 100000
                                ? `-${obj.order}`
                                : "-Sin prioridad"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            ${Number(obj.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {obj.agotado ? "Si" : "No"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {obj.favorito ? "Si" : "No"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link
                                    href={`/admin/products/${obj.productId}`}
                                  >
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Button
                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                    size="icon"
                                    variant="ghost"
                                    disable={downloading}
                                    onClick={() =>
                                      deleteProduct(obj.productId, obj.image)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {FilterAgotado.sort((a, b) => a.order - b.order)
                        .filter(
                          (obj) => !webshop.store.categoria.includes(obj.caja)
                        )
                        .map((obj, ind) => (
                          <TableRow>
                            <TableCell className="hidden sm:table-cell">
                              <Image
                                alt={obj.title ? obj.title : `Producto${ind}`}
                                className="aspect-square rounded-md object-cover"
                                height={64}
                                src={
                                  obj.image
                                    ? obj.image
                                    : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                                }
                                style={{
                                  aspectRatio: "64/64",
                                  objectFit: "cover",
                                }}
                                width={64}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {obj.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {" "}
                                {obj.caja ? obj.caja : "Sin categoria"}{" "}
                                {obj.order < 100000
                                  ? `-${obj.order}`
                                  : "-Sin prioridad"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              ${Number(obj.price).toFixed(2)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {obj.agotado ? "Si" : "No"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {obj.favorito ? "Si" : "No"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Link
                                      href={`/admin/products/${obj.productId}`}
                                    >
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Button
                                      className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                      size="icon"
                                      variant="ghost"
                                      disable={downloading}
                                      onClick={() =>
                                        deleteProduct(obj.productId, obj.image)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="favorito">
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
                      {OrderProducts(
                        FilterFavorito,
                        webshop.store.categoria
                      ).map((obj, ind) => (
                        <TableRow>
                          <TableCell className="hidden sm:table-cell">
                            <Image
                              alt={obj.title ? obj.title : `Producto${ind}`}
                              className="aspect-square rounded-md object-cover"
                              height={64}
                              src={
                                obj.image
                                  ? obj.image
                                  : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                              }
                              style={{
                                aspectRatio: "64/64",
                                objectFit: "cover",
                              }}
                              width={64}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {obj.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {" "}
                              {obj.caja ? obj.caja : "Sin categoria"}{" "}
                              {obj.order < 100000
                                ? `-${obj.order}`
                                : "-Sin prioridad"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            ${Number(obj.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {obj.agotado ? "Si" : "No"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {obj.favorito ? "Si" : "No"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link
                                    href={`/admin/products/${obj.productId}`}
                                  >
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Button
                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                    size="icon"
                                    variant="ghost"
                                    disable={downloading}
                                    onClick={() =>
                                      deleteProduct(obj.productId, obj.image)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {FilterFavorito.sort((a, b) => a.order - b.order)
                        .filter(
                          (obj) => !webshop.store.categoria.includes(obj.caja)
                        )
                        .map((obj, ind) => (
                          <TableRow>
                            <TableCell className="hidden sm:table-cell">
                              <Image
                                alt={obj.title ? obj.title : `Producto${ind}`}
                                className="aspect-square rounded-md object-cover"
                                height={64}
                                src={
                                  obj.image
                                    ? obj.image
                                    : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                                }
                                style={{
                                  aspectRatio: "64/64",
                                  objectFit: "cover",
                                }}
                                width={64}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {obj.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {" "}
                                {obj.caja ? obj.caja : "Sin categoria"}{" "}
                                {obj.order < 100000
                                  ? `-${obj.order}`
                                  : "-Sin prioridad"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              ${Number(obj.price).toFixed(2)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {obj.agotado ? "Si" : "No"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {obj.favorito ? "Si" : "No"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Link
                                      href={`/admin/products/${obj.productId}`}
                                    >
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Button
                                      className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                      size="icon"
                                      variant="ghost"
                                      disable={downloading}
                                      onClick={() =>
                                        deleteProduct(obj.productId, obj.image)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
function OrderProducts(productos, categorias) {
  console.log(categorias);

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

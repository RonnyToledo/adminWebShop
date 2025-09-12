"use client";
import React, { useContext } from "react";
import { Edit2, X, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { logoApp } from "@/utils/image";

const imagenes = [
  "https://res.cloudinary.com/dbgnyc842/image/upload/v1749600395/wpr2ti7cgr588wasgjoh.webp",
  "https://res.cloudinary.com/dbgnyc842/image/upload/v1722107232/dlyjfo7slsh6acdnqnnp.png",
  "https://res.cloudinary.com/dbgnyc842/image/upload/v1722702058/wkqtkbld0y8x3gj94eg1.jpg",
];

export default function Component({ ThemeContext }) {
  const { webshop, setwebshop } = useContext(ThemeContext);
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Store Name */}
        <div className="mb-8">
          <Link
            className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-6"
            href="/header"
          >
            {webshop?.store?.name || "Nombre de la tienda"}
            <Edit2 className="h-4 w-4 text-gray-500" />
          </Link>
        </div>

        {/* Main Content Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {!((webshop?.products || []).length > 0) ? (
            <CarruselNew products={webshop?.products || []} />
          ) : (
            <PorductoNuevo
              product={webshop?.products.reduce((masReciente, actual) => {
                return new Date(actual.creado) > new Date(masReciente.creado)
                  ? actual
                  : masReciente;
              })}
            />
          )}

          {/* Customize Store Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <CardTitle className="text-xl mb-2">Edite su tienda</CardTitle>
              <div className="mb-6">
                <Image
                  src={webshop?.store?.urlPoster || logoApp}
                  alt={webshop?.store?.name || "Store Image"}
                  width={200}
                  height={200}
                  className="object-contain aspect-square rounded-lg"
                />
              </div>
              <CardHeader className="p-0 mb-4">
                <CardDescription className="text-base">
                  Seleccione su foto de portada, foto de perfil, nombre de su
                  tienda y párrafo de presentación
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="link"
                  onClick={() => router.push("/configuracion")}
                >
                  Editar
                </Button>
              </CardFooter>
            </div>
          </Card>
        </div>

        {/* Bottom Setup Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Shopify Payments */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg">
                Seleccione su metodo de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push("/configuracion")}
              >
                Ver
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Rates */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg">Revisa tus productos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push("/products")}
              >
                Ir
              </Button>
            </CardContent>
          </Card>

          {/* Domain */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg">Guía sobre su dominio</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Link
                className="flex items-center gap-2 mb-4"
                href={`https://roumenu.vercel.app/t/${webshop?.store?.sitioweb}`}
              >
                <span className="text-sm text-gray-900">
                  {`roumenu.vercel.app/t/${webshop?.store?.sitioweb}`}
                </span>
                <ExternalLink className="h-4 w-4 text-gray-500" />
              </Link>
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push("/guia")}
              >
                Links
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
function CarruselNew({ products }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <CardTitle className="text-xl mb-2">Crear más productos</CardTitle>
        <div className="mb-6">
          <Carousel
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
          >
            <CarouselContent>
              {imagenes.map((imagenes, index) => (
                <CarouselItem className="flex justify-center" key={index}>
                  <Image
                    src={imagenes || logoApp}
                    alt={`Product Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="object-contain aspect-square rounded-lg"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        <CardHeader className="p-0 mb-4">
          <CardDescription className="text-base">
            {products.length > 0 ? "Agregue más " : " Comience agregando un "}{" "}
            {`producto(s) y algunos detalles clave. ¿No
                  estás listo?`}{" "}
            <Link href="/newProduct" className="text-blue-600 hover:underline">
              Creemos uno nuevo
            </Link>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-3">
          <Button variant="link" onClick={() => router.push("/newProduct")}>
            Agregar
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
function PorductoNuevo({ product }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <CardTitle className="text-xl mb-2">{"Producto agregado!"}</CardTitle>
        <CardContent className="p-0 mb-6">
          <Link href={`/products/${product.productId}`}>
            <div className={`relative rounded-2xl`}>
              <div className=" rounded-lg overflow-hidden">
                <Image
                  id={`product-img-${product.productId}`}
                  src={product.image || logoApp}
                  alt={product.title || "Product"}
                  className={`w-[200px] aspect-square object-cover`}
                  height={200}
                  width={200}
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-end p-2 md:p-4 rounded-2xl">
                <p className=" text-xs md:text-sm text-white font-semibold  line-clamp-2 text-start ">
                  {product.title}
                </p>
                <p className="text-sm text-red-600 font-semibold  line-clamp-2 ">
                  ${product.price}
                </p>
              </div>
            </div>
          </Link>
        </CardContent>
        <CardHeader className="p-0 mb-4">
          <CardDescription className="text-base">
            {`¡Genial! Tu producto ha sido agregado. Puedes editarlo o agregar más productos. `}
            <Link
              href={`/products/${product.productId}`}
              className="text-blue-600 hover:underline"
            >
              Creemos otro
            </Link>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-3">
          <Button variant="link" onClick={() => router.push("/newProduct")}>
            Agregar más productos
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

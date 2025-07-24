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
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Add Product Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <Carousel
                  plugins={[
                    Autoplay({
                      delay: 3000,
                    }),
                  ]}
                >
                  <CarouselContent>
                    {((webshop?.products || []).length > 0
                      ? webshop?.products
                          .filter((item) => item.image)
                          .sort(() => Math.random() - 0.5) // Mezcla aleatoriamente el array
                          .slice(0, 3) // Toma los 3 primeros
                          .map((item) => item.image)
                      : imagenes
                    ).map((imagenes, index) => (
                      <CarouselItem className="flex justify-center" key={index}>
                        <Image
                          src={imagenes}
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
                <CardTitle className="text-xl mb-2">
                  {(webshop?.products || []).length > 0
                    ? "Crear más productos"
                    : "Agregar tu primer producto"}
                </CardTitle>
                <CardDescription className="text-base">
                  {(webshop?.products || []).length > 0
                    ? "Agregue más "
                    : " Comience agregando un "}{" "}
                  {`producto(s) y algunos detalles clave. ¿No
                  estás listo?`}{" "}
                  <Link
                    href="/newProduct"
                    className="text-blue-600 hover:underline"
                  >
                    Creemos uno nuevo
                  </Link>
                </CardDescription>
              </CardHeader>
              <div className="flex gap-3">
                <Button
                  variant="link"
                  onClick={() => router.push("/newProduct")}
                >
                  Agregar
                </Button>
              </div>
            </div>
          </Card>

          {/* Customize Store Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <Image
                  src={
                    webshop?.store?.urlPoster ||
                    "/placeholder.svg?height=200&width=200"
                  }
                  alt={webshop?.store?.name || "Store Image"}
                  width={200}
                  height={200}
                  className="object-contain aspect-square rounded-lg"
                />
              </div>
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl mb-2">
                  Edite su tienda Online
                </CardTitle>
                <CardDescription className="text-base">
                  Seleccione su foto de portada, foto de perfil, nombre de su
                  tienda y párrafo de presentación
                </CardDescription>
              </CardHeader>
              <Button variant="link" onClick={() => router.push("/header")}>
                Editar
              </Button>
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
                href={`https://rou-katax.vercel.app/t/${webshop?.store?.sitioweb}`}
              >
                <span className="text-sm text-gray-900">
                  {`rou-katax.vercel.app/t/${webshop?.store?.sitioweb}`}
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

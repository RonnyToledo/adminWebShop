"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Star, ScreenShareOff } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { ThemeContext } from "@/app/admin/layout";
import chroma from "chroma-js";

export default function Product() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [coloresPastel, setColoresPastel] = useState([]);

  useEffect(() => {
    setColoresPastel(asignarColoresCategorias(webshop.store.categoria));
  }, [webshop.store.categoria]);

  const deleteProduct = async (productId, image) => {
    setDownloading(true);
    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("Id", productId);

    try {
      await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/products/${productId}/`,
        {
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setWebshop((prev) => ({
        ...prev,
        products: prev.products.filter(
          (product) => product.productId !== productId
        ),
      }));

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
        action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
      });
    } catch (error) {
      toast({
        title: "Error al eliminar",
        variant: "destructive",
        description: "No se pudo eliminar el producto.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-6 bg-gray-100 dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Productos</h2>
        <div className="grid gap-4">
          {OrderProducts(webshop.products, webshop.store.categoria).map(
            (product, index) => (
              <ProductCard
                key={product.productId || index}
                product={product}
                deleteProduct={deleteProduct}
                color={coloresPastel[product.caja]}
                downloading={downloading}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}

function ProductCard({ product, deleteProduct, color, downloading }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-md shadow">
      <Link href={`/admin/products/${product.productId}`}>
        <Image
          alt={product.title || "Producto"}
          src={product.image || "/default_image.png"}
          width={64}
          height={64}
          className="rounded-md"
          style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
        />
      </Link>
      <div className="flex-1 ml-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {product.title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">${product.price}</p>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: color }}
        >
          {product.caja || "Sin categoría"}
        </span>
      </div>
      <div className="flex gap-2">
        {product.visible && <EyeIcon />}
        {product.favorito && <StarIcon />}
        {product.agotado && <ScreenShareOffIcon />}
        <Button
          onClick={() => deleteProduct(product.productId, product.image)}
          size="icon"
          variant="outline"
        >
          {downloading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <DeleteIcon />
          )}
        </Button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <Eye className="w-4 h-4 text-green-600" />;
}

function StarIcon() {
  return <Star className="w-4 h-4 text-blue-600" />;
}

function ScreenShareOffIcon() {
  return <ScreenShareOff className="w-4 h-4 text-red-600" />;
}

function DeleteIcon() {
  return (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
      <line x1="18" x2="12" y1="9" y2="15" />
      <line x1="12" x2="18" y1="9" y2="15" />
    </svg>
  );
}

function OrderProducts(products, categories) {
  return categories
    .map((cat) =>
      products
        .filter((prod) => prod.caja === cat)
        .sort((a, b) => a.order - b.order)
    )
    .flat();
}

function asignarColoresCategorias(categories) {
  const pastelColors = chroma
    .scale(["#ffffff", "#ff8080"])
    .mode("lab")
    .colors(categories.length);
  return categories.reduce(
    (acc, category, i) => ({ ...acc, [category]: pastelColors[i] }),
    {}
  );
}

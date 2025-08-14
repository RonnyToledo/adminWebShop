import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductDetailPage({
  product,
  store,
  links = [],
  logoApp = "",
  id = "",
  handleToCart = () => {},
  BreadCrumpParent = null,
  ExpandableText = null,
  RatingSection = null,
}) {
  const [countAddCart, setCountAddCart] = useState(1);
  const [swipeDirection, setSwipeDirection] = useState("next");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Configuración de animaciones de swipe
  const swipeComponents = {
    corto: "slide-in-from-bottom-3",
    amplio: "slide-in-from-bottom-6",
  };

  // Función para redondeo inteligente
  const smartRound = (price) => {
    return Math.round(price * 100) / 100;
  };

  // Manejadores de swipe touch
  const handleSwipeStart = (e) => {
    // Lógica de swipe start si es necesaria
  };

  const handleSwipeEnd = (e) => {
    // Lógica de swipe end si es necesaria
  };

  // Manejador para agregar al carrito con animación
  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    // Simular delay de agregado
    setTimeout(() => {
      handleToCart({
        ...product,
        Cant: (product?.Cant || 0) + countAddCart || 0,
      });

      setIsAddingToCart(false);
      setShowSuccess(true);

      // Resetear éxito después de 2 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    }, 1000);
  };

  return (
    <main>
      <div className="grid grid-cols-1 gap-2 items-start p-4">
        {BreadCrumpParent && <BreadCrumpParent list={links} />}

        <AnimatePresence>
          <div
            className="relative rounded-b-2xl overflow-hidden"
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            <motion.div
              key={product?.productId || ""}
              initial={{
                opacity: 0,
                x: swipeDirection === "next" ? 100 : -100,
              }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === "next" ? -100 : 100 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                width={500}
                height={500}
                alt={product?.title || "Product"}
                className={`w-full rounded-lg shadow-lg border border-[var(--border-gold)] ${
                  product?.span ? "aspect-video" : "aspect-square"
                }`}
                src={product?.image || store?.urlPoster || logoApp}
              />
            </motion.div>
          </div>

          {/* Miniaturas */}
          {product?.imagesecondary?.filter((obj) => obj !== logoApp).length >
            0 && (
            <div className="grid grid-cols-3 gap-1">
              {product?.imagesecondary
                .filter((obj) => obj !== logoApp)
                .map((image, index) => (
                  <Image
                    key={index}
                    width={100}
                    height={100}
                    src={image || store?.urlPoster || logoApp}
                    alt={`${product?.title} vista ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ))}
            </div>
          )}
        </AnimatePresence>

        <div
          className={`space-y-1 animate-in ${swipeComponents.corto} duration-700`}
        >
          {/* Título y precio */}
          <div className="flex flex-col items-start justify-between space-y-1">
            <h1
              className={`line-clamp-1 text-sm font-bold text-gray-900 animate-in ${swipeComponents.corto} duration-500 delay-200`}
            >
              {product?.title || "..."}
            </h1>

            <div
              className={`flex items-center gap-1 animate-in ${swipeComponents.corto} duration-500 delay-300`}
            >
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`size-2.5 ${
                      i < Math.floor(product?.coment?.promedio || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-500"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[8px] text-gray-600">
                {product?.coment?.promedio || 0} ({product?.coment?.total || 0}{" "}
                reseñas)
              </span>
            </div>
          </div>

          {/* Precio */}
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-1 animate-in ${swipeComponents.corto} duration-500 delay-400 leading-relaxed text-gray-900`}
            >
              <p className="leading-relaxed text-gray-900 text-[8px]">
                ${smartRound(product?.price || 0).toFixed(2)}{" "}
                {store?.moneda_default?.moneda}
              </p>
              {(product?.oldPrice || 0) > (product?.price || 0) && (
                <p className="text-gray-500 line-through text-[8px]">
                  ${product?.oldPrice}
                </p>
              )}
              {(product?.oldPrice || 0) > (product?.price || 0) && (
                <Badge
                  variant="destructive"
                  className="animate-pulse text-[8px]"
                >
                  {Math.round(
                    ((product?.oldPrice || 0 - (product?.price || 0)) /
                      (product?.oldPrice || 0)) *
                      100
                  )}
                  % OFF
                </Badge>
              )}
            </div>

            <div className="flex gap-1">
              <div
                className={`animate-in ${swipeComponents.corto} duration-500 delay-1100`}
              >
                {!product?.agotado ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse size-4" />
                    <span className=" font-medium text-[6px]">En stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    <span className="text-[4px] font-medium ">Agotado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {store?.carrito && (
            <>
              <div className="flex flex-col">
                {/* Cantidad */}
                <div
                  className={`animate-in ${swipeComponents.corto} duration-500 delay-900`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={countAddCart === 0 || product?.agotado}
                      onClick={() => setCountAddCart(countAddCart - 1)}
                      className="hover:scale-105 transition-transform duration-200 size-3 p-2 text-[10px]"
                    >
                      -
                    </Button>
                    <span className="text-center font-medium text-[8px]">
                      {countAddCart}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={product?.agotado}
                      onClick={() => setCountAddCart(countAddCart + 1)}
                      className="hover:scale-105 transition-transform duration-200 size-3 p-2 text-[10px]"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div
                className={`space-y-0 animate-in ${swipeComponents.corto} duration-500 delay-1000`}
              >
                <Button
                  type="button"
                  disabled={product?.agotado}
                  onClick={handleAddToCart}
                  className={`w-full h-4 text-[4px] font-medium rounded-3xl transition-all duration-300 ${
                    showSuccess
                      ? "bg-green-600 hover:bg-green-700"
                      : "hover:scale-105"
                  } ${isAddingToCart ? "scale-95" : ""}`}
                >
                  {isAddingToCart ? (
                    <div className="flex items-center gap-1">
                      <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Agregando...
                    </div>
                  ) : showSuccess ? (
                    <div className="flex items-center gap-1">
                      <div className="size-3 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                      </div>
                      ¡Agregado al carrito!
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[6px]">
                      Agregar al carrito - $
                      {((product?.price || 0) * countAddCart).toFixed(2)}
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-4 text-[6px] rounded-3xl hover:scale-105 transition-transform duration-200 bg-transparent"
                >
                  Comprar ahora
                </Button>
              </div>
            </>
          )}

          <Separator />

          <Tabs defaultValue="description" className="min-h-[20vh] ">
            <TabsList className="h-auto">
              <TabsTrigger value="description" className="text-[6px]">
                Descripcion
              </TabsTrigger>
              <TabsTrigger value="rating" className="text-[6px]">
                Valoracion
              </TabsTrigger>
              <TabsTrigger value="details" className="text-[6px]">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <div
                className={`animate-in ${swipeComponents.amplio} duration-500 delay-500`}
              >
                {ExpandableText ? (
                  <ExpandableText text={product?.descripcion || "..."} />
                ) : (
                  <p className="text-[8px]">{product?.descripcion || "..."}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rating">
              {RatingSection ? (
                <RatingSection
                  specific={product?.productId || id}
                  sitioweb={store?.sitioweb || ""}
                />
              ) : (
                <div className="text-[4px]">
                  Sistema de valoraciones no disponible
                </div>
              )}
            </TabsContent>
            <TabsContent value="details">
              {product.caracteristicas.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-foreground group"
                >
                  <div className="flex items-center text-[6px]">
                    <span className="size-0.5 bg-primary rounded-full mr-3"></span>
                    {item}
                  </div>
                </li>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

// Ejemplo de uso:
/*
import ProductDetailPage from './ProductDetailPage';
import BreadCrumpParent from './BreadCrumpParent';
import ExpandableText from './ExpandableText';
import RatingSection from './RatingSection';

<ProductDetailPage
  product={product}
  store={store}
  links={breadcrumbLinks}
  logoApp="/logo.png"
  id="123"
  handleToCart={addToCartFunction}
  BreadCrumpParent={BreadCrumpParent}
  ExpandableText={ExpandableText}
  RatingSection={RatingSection}
/>
*/

"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, AlertCircle, Eye, Loader } from "lucide-react";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import ImageUploadDrag from "../component/ImageDND";
import { v4 as uuidv4 } from "uuid";
import SecondaryImagesManager from "./Specific/secondaryImagesManager";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2, Info, X } from "lucide-react";
import axios from "axios";

export function ProductEditForm({
  product,
  onProductChange,
  changes = false,
  newImage,
  setNewImage,
}) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [newTag, setNewTag] = useState("");
  const [deleteOriginal, setDeleteOriginal] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [selectedMoneda, setSelectedMoneda] = useState("");
  const [newCategory, setnewCategory] = useState("");
  const [loadingCategory, setloadingCategory] = useState(false);

  const updateProduct = (field, value) => {
    onProductChange({ ...product, [field]: value });
  };

  useEffect(() => {
    // cuando product carga, sincronizamos
    if (
      product?.default_moneda !== undefined &&
      product?.default_moneda !== null
    ) {
      setSelectedMoneda(
        webshop?.store?.monedas.find(
          (currency) => currency.id == product?.default_moneda
        )?.id
          ? product?.default_moneda
          : webshop?.store?.monedas.find((currency) => currency.defecto)
              ?.nombre ?? ""
      );
    }
  }, [product?.default_moneda]);

  const addTag = () => {
    if (newTag.trim() && !product?.caracteristicas.includes(newTag.trim())) {
      updateProduct("caracteristicas", [
        ...product?.caracteristicas,
        newTag.trim(),
      ]);
      setNewTag("");
    } else {
      toast.error("Error: Etiqueta ya creada o invalida");
    }
  };

  const removeTag = (tagToRemove) => {
    updateProduct(
      "caracteristicas",
      product?.caracteristicas.filter((tag) => tag !== tagToRemove)
    );
  };

  const addAddon = () => {
    const newAddon = {
      id: uuidv4(),
      name: "",
      price: 0,
    };
    updateProduct("agregados", [...product?.agregados, newAddon]);
  };

  const updateAddon = (addonId, field, value) => {
    const updatedAddons = product?.agregados.map((addon) =>
      addon.id === addonId ? { ...addon, [field]: value } : addon
    );
    updateProduct("agregados", updatedAddons);
  };

  const removeAddon = (addonId) => {
    const filteredAddons = product?.agregados.filter(
      (addon) => addon.id !== addonId
    );
    updateProduct("agregados", filteredAddons);
  };

  const handleImagesChange = useCallback((newImages) => {
    onProductChange((prev) => {
      const prevImgs = Array.isArray(prev?.imagesecondary)
        ? prev?.imagesecondary
        : [];
      if (arraysEqual(prevImgs, newImages)) {
        return prev;
      }
      return { ...prev, imagesecondary: newImages };
    });
  }, []);
  const handleImagesChangeClean = useCallback((cleanImages) => {
    onProductChange((prev) => {
      const prevClean = (prev?.imagesecondary || []).filter(Boolean);
      if (arraysEqual(prevClean, cleanImages)) return prev;
      const fixed = [...cleanImages];
      while (fixed.length < 3) fixed.push(logoApp);
      return { ...prev, imagesecondary: fixed };
    });
  }, []);

  const addCategory = async () => {
    setloadingCategory(true);
    // Validaciones básicas antes de llamar a la API
    if (!newCategory || newCategory.trim() === "") {
      toast.error("Debes indicar el nombre de la categoría.");
      return;
    }
    if (!webshop?.store?.sitioweb || !webshop?.store?.UUID) {
      toast.error(
        "Información de la tienda incompleta. Revisa la configuración."
      );
      return;
    }
    // Preparamos el payload (JSON). No meter headers en el cuerpo.
    const payload = {
      name: newCategory,
      storeId: webshop.store.UUID,
      order: webshop.store?.category?.length ?? 0,
    };
    // Construimos la promesa de la petición POST
    const postPromise = axios.post(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      payload,
      {
        // Para JSON axios suele poner Content-Type por defecto, pero lo dejamos explícito si lo prefieres:
        headers: { "Content-Type": "application/json" },
      }
    );
    try {
      // toast.promise gestionará loading / success / error visualmente
      const res = toast.promise(postPromise, {
        loading: "Creando categoría...",
        success: (response) => {
          // Aceptamos 200 o 201 como éxito
          if (response?.status === 200 || response?.status === 201) {
            // Intentamos extraer la categoría devuelta por el servidor:
            // primero response.data.data (tu patrón actual), si no existe, fallback a response.data
            const createdCategory =
              response?.data?.data ?? response?.data ?? null;
            // Si el backend no devuelve la nueva categoría, aún podemos construirla localmente,
            // pero preferimos usar lo que venga del servidor para mantener IDs/metadata correctos.
            if (createdCategory) {
              updateProduct("caja", createdCategory?.id);
              setWebshop((prevData) => ({
                ...prevData,
                store: {
                  ...prevData.store,
                  categoria: [
                    ...(prevData.store.categoria ?? []),
                    createdCategory,
                  ],
                },
              }));
            } else {
              // Fallback: añadimos lo mínimo que tenemos (puede carecer de UUID real del servidor)
              const fallbackCat = { ...payload, id: `temp-${Date.now()}` };
              setWebshop((prevData) => ({
                ...prevData,
                store: {
                  ...prevData.store,
                  categoria: [...(prevData.store.categoria ?? []), fallbackCat],
                },
              }));
            }
            // Limpiar estado del formulario
            setnewCategory("");
            return response?.data?.message ?? "Categoría creada correctamente";
          }
          // Si el status no es 200/201 lo tratamos como mensaje inesperado
          return `Respuesta inesperada del servidor: ${response?.status}`;
        },
        error: (err) => {
          // Mensaje legible para mostrar en el toast
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo crear la categoría";
          return `Error: ${msg}`;
        },
      });
      // Opcional: devolver la respuesta si quien llama la función la necesita
      return res;
    } catch (err) {
      // El toast de error ya se mostró mediante toast.promise; igual registramos para debugging
      console.error("addCategory error:", err);
    } finally {
      // Aseguramos limpiar estados en cualquier caso
      // Aseguramos que newCat se resetea (ya lo hacemos en success), aquí como seguro final
      setShowCategoryInput(false);
      setloadingCategory(false);
    }
  };

  // Calcula el porcentaje de ganancia (margen) mostrado en la UI.
  // Se usa la misma fórmula que la UI ya mostraba: ((price - cost) / price) * 100
  // Devolvemos un número entre 0 y 99.99 (evitamos 100 para no dividir por 0 al calcular precio).
  const marginPercentage = (() => {
    const cost = Number(product?.priceCompra) || 0;
    const price = Number(product?.price) || 0;
    if (cost <= 0 || price <= 0) return 0;
    const raw = ((price - cost) / price) * 100;
    if (!isFinite(raw) || Number.isNaN(raw)) return 0;
    // clamp entre 0 y 99.99
    return Math.max(0, Math.min(99.99, Number(raw.toFixed(2))));
  })();

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {changes && (
          <div>
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Cambios sin guardar</span>
          </div>
        )}
        <Button
          disabled
          size="default"
          variant="outline"
          className="gap-2 bg-transparent"
        >
          <Eye className="h-4 w-4" />
          Vista Previa
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Título del Producto
                    <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={cn(
                      "text-xs",
                      product?.title?.length > 60
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {product?.title?.length}/60
                  </span>
                </div>
                <Input
                  id="title"
                  placeholder="Ej: Laptop Dell Inspiron 15"
                  className="text-base"
                  value={product?.title}
                  onChange={(e) => updateProduct("title", e.target.value)}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  Un título claro y descriptivo ayuda a los clientes a encontrar
                  tu producto
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descripción</Label>
                  <span
                    className={cn(
                      "text-xs",
                      product?.descripcion?.length > 500
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {product?.descripcion?.length}/500
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe las características principales, beneficios y detalles importantes del producto..."
                  rows={6}
                  className="resize-none text-xs"
                  value={product?.descripcion}
                  onChange={(e) => updateProduct("descripcion", e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Incluye detalles como materiales, dimensiones, colores
                  disponibles, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  Categoría
                  <span className="text-destructive">*</span>
                </Label>
                {!showCategoryInput ? (
                  <div className="flex gap-2">
                    <Select
                      value={product?.caja}
                      onValueChange={(value) => updateProduct("caja", value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {webshop?.store?.categoria.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCategoryInput(true)}
                      title="Crear nueva categoría"
                      disabled={loadingCategory}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nueva categoría"
                      value={newCategory}
                      onChange={(e) => setnewCategory(e.target.value)}
                    />
                    <Button
                      className="rounded-full size-10"
                      disabled={loadingCategory}
                      type="button"
                      variant="outline"
                      onClick={addCategory}
                    >
                      {loadingCategory ? (
                        <Loader className="animate-spin" />
                      ) : (
                        <Plus />
                      )}
                    </Button>
                    <Button
                      type="button"
                      disabled={loadingCategory}
                      className="rounded-full   size-10"
                      variant="destructive"
                      onClick={() => setShowCategoryInput(false)}
                    >
                      {loadingCategory ? (
                        <Loader className="animate-spin" />
                      ) : (
                        <X />
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ayuda a organizar tus productos y facilita la búsqueda
                </p>
              </div>
            </CardContent>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
            <CardDescription>
              Agrega fotos de alta calidad de tu producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-8">
              <Label>Imagen Principal</Label>
              {newImage ? (
                <div className="relative">
                  <Image
                    alt="Logo"
                    className="rounded-xl  mx-auto my-1 aspect-square"
                    height={300}
                    width={300}
                    src={
                      newImage
                        ? URL.createObjectURL(newImage)
                        : webshop?.store?.urlPoster || logoApp
                    }
                    style={{
                      objectFit: "cover",
                    }}
                  />

                  <div className="absolute top-1 right-1 z-[1]">
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-full p-2 h-8 w-8"
                      size="icon"
                      onClick={() => setNewImage(null)} // Borra la nueva imagen
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ) : !deleteOriginal && product?.image ? (
                <div className="relative">
                  <Image
                    src={product?.image || logoApp}
                    alt={product?.title || "Product"}
                    width={300}
                    height={300}
                    style={{ objectFit: "cover" }}
                    className="object-contain h-full w-full aspect-square"
                  />
                  <div className="absolute top-1 right-1 z-[1]">
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-full p-2 h-8 w-8"
                      size="icon"
                      onClick={() => setDeleteOriginal(true)} // Marca la original para borrar
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <ImageUploadDrag
                    setImageNew={setNewImage} // Permite subir nueva imagen
                    imageNew={newImage}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta será la primera imagen que verán los clientes
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col justify-between mb-2 gap-2">
                <Label>
                  Imágenes Adicionales ({product?.imagesecondary?.length}/3)
                </Label>
                <div className="">
                  <SecondaryImagesManager
                    initialImages={product?.imagesecondary || []}
                    onChange={handleImagesChange}
                    onChangeClean={handleImagesChangeClean}
                    maxImages={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Muestra diferentes ángulos y detalles del producto
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Precios e Inventario</CardTitle>
            <CardDescription>
              Gestiona precios, costos y disponibilidad de stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale-price">
                  Venta ($)
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sale-price"
                  type="number"
                  placeholder="0.00"
                  value={product?.price}
                  onChange={(e) =>
                    updateProduct(
                      "price",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Precio que pagarán tus clientes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase-price">Inversion ($)</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  placeholder="0.00"
                  value={product?.priceCompra}
                  onChange={(e) =>
                    updateProduct(
                      "priceCompra",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Tu costo de adquisición
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package-price">Embalaje ($)</Label>
                <Input
                  id="package-price"
                  type="number"
                  placeholder="0.00"
                  value={product?.embalaje}
                  onChange={(e) =>
                    updateProduct(
                      "embalaje",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Costo de empaque y envío
                </p>
              </div>
              {webshop?.store?.stocks ? (
                <div className="space-y-2">
                  <Label htmlFor="stock">Unidades en Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="1"
                    defaultValue="1"
                    value={product?.stock}
                    onChange={(e) =>
                      updateProduct(
                        "stock",
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantidad disponible
                  </p>
                </div>
              ) : (
                <div className="gap-2">
                  <Label>Producto en Stock</Label>
                  <Switch
                    checked={product?.stock}
                    onCheckedChange={() =>
                      updateProduct("stock", product?.stock ? 0 : 1)
                    }
                  />
                </div>
              )}
            </div>

            {product?.priceCompra > 0 && (
              <div className="rounded-lg bg-muted/50 p-4 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ganancia</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {Number(
                        ((product?.price - product?.priceCompra) /
                          product?.price) *
                          100
                      ).toFixed(2)}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground">
                      $
                      {Number(product?.price - product?.priceCompra).toFixed(2)}{" "}
                      de ganancia
                    </div>
                  </div>
                </div>
                <Slider
                  value={[marginPercentage]}
                  max={99.99}
                  min={0}
                  step={0.1}
                  // onValueChange es la API habitual; mantenemos onChange por compatibilidad
                  onValueChange={(value) => {
                    const val = Array.isArray(value) ? value[0] : value;
                    let p = Number(val) || 0;
                    // evitar 100% (division por 0). Capear a 99.99
                    if (p >= 99.99) p = 99.99;
                    const cost = Number(product?.priceCompra) || 0;
                    let newPrice = 0;
                    if (cost > 0) {
                      const denom = 1 - p / 100;
                      // denom > 0 siempre aquí porque p < 100
                      newPrice = denom > 0 ? cost / denom : cost;
                    }
                    // redondear a 2 decimales
                    updateProduct("price", Number(newPrice.toFixed(2)) || 0);
                  }}
                />
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda de Venta</Label>
                <Select
                  value={selectedMoneda}
                  onValueChange={(v) => {
                    setSelectedMoneda(v);
                    updateProduct("default_moneda", v); // si quieres persistir inmediatamente
                  }}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {webshop?.store?.monedas.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles Adicionales</CardTitle>
            <CardDescription>
              Configuraciones opcionales para personalizar tu producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-input bg-background px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="double-space" className="cursor-pointer">
                    Doble Espacio
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Más espacio en el listado
                  </p>
                </div>
                <Switch
                  id="double-space"
                  checked={product?.span}
                  onCheckedChange={() =>
                    updateProduct("visible", !product?.span)
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-input bg-background px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="sale-product" className="cursor-pointer">
                    Producto de Venta
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Disponible para compra
                  </p>
                </div>
                <Switch
                  id="sale-product"
                  checked={product?.venta}
                  onCheckedChange={() =>
                    updateProduct("venta", !product?.venta)
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between w-full rounded-lg border border-input bg-background px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="visible" className="cursor-pointer">
                  Visible en Tienda
                </Label>
                <p className="text-xs text-muted-foreground">
                  Los clientes pueden verlo
                </p>
              </div>
              <Switch
                id="visible"
                checked={product?.visible}
                onCheckedChange={() =>
                  updateProduct("visible", !product?.visible)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Ej: nuevo, oferta, destacado..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <Button type="button" onClick={addTag}>
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Presiona Enter para agregar. Las etiquetas ayudan a filtrar y
                buscar productos
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {product?.caracteristicas.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => {
                      removeTag(tag);
                    }}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Product Addons */}
        <Card>
          <CardHeader>
            <CardTitle>Agregados del Producto</CardTitle>
            <CardDescription>
              Opciones extras que los clientes pueden agregar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
              {(product?.agregados || []).length === 0 ? (
                <div>
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Sin agregados configurados
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permite a los clientes personalizar con extras como
                      garantía extendida, instalación, accesorios, etc.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(product?.agregados || []).map((addon, index) => (
                    <div
                      key={addon.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Agregado #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddon(addon.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={addon.name}
                            onChange={(e) =>
                              updateAddon(addon.id, "name", e.target.value)
                            }
                            placeholder="Ej: Extra queso, Tamaño grande..."
                          />
                        </div>
                        <div>
                          <Label>Precio ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={addon.price}
                            onChange={(e) =>
                              updateAddon(
                                addon.id,
                                "price",
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={addAddon}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Extra
              </Button>
              <p className="text-xs text-muted-foreground">
                Escriba el nombre completo y el precio completo del agregado
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Consjeos rapidos */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Consejos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Usa imágenes de alta calidad con fondo blanco</p>
            <p>• Escribe descripciones claras y detalladas</p>
            <p>• Revisa los precios antes de publicar</p>
            <p>• Usa etiquetas relevantes para mejor búsqueda</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function arraysEqual(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

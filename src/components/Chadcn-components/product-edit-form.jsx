"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import ImageUploadDrag from "../component/ImageDND";
import { v4 as uuidv4 } from "uuid";
import SecondaryImagesManager from "./Specific/secondaryImagesManager";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export function ProductEditForm({
  product,
  onProductChange,
  isCreating = false,
  newImage,
  setNewImage,
}) {
  const { webshop } = useContext(ThemeContext);
  const [newTag, setNewTag] = useState("");
  const [deleteOriginal, setDeleteOriginal] = useState(false);
  const [selectedMoneda, setSelectedMoneda] = useState("");

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

  console.log(
    webshop?.store?.monedas.find(
      (currency) => currency.id == product?.default_moneda
    )?.nombre
  );
  return (
    <div className="grid grid-cols-2 gap-1">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título del Producto</Label>
            <Input
              id="title"
              value={product?.title}
              onChange={(e) => updateProduct("title", e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={product?.descripcion}
              onChange={(e) => updateProduct("descripcion", e.target.value)}
              placeholder="Describe tu producto..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={product?.caja}
              onValueChange={(value) => updateProduct("caja", value)}
            >
              <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
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
                <Label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="images"
                >
                  Imágenes
                </Label>
                <ImageUploadDrag
                  setImageNew={setNewImage} // Permite subir nueva imagen
                  imageNew={newImage}
                />
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Precios e Inventario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Precio de Venta ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={product?.price}
                onChange={(e) =>
                  updateProduct("price", Number.parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Precio de Compra ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={product?.priceCompra}
                onChange={(e) =>
                  updateProduct(
                    "priceCompra",
                    Number.parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="embalaje">Precio de Embalaje ($)</Label>
              <Input
                id="embalaje"
                type="number"
                step="0.01"
                value={product?.embalaje}
                onChange={(e) =>
                  updateProduct(
                    "embalaje",
                    Number.parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
            {webshop?.store?.stocks ? (
              <div>
                <Label htmlFor="stock">Unidades en stock</Label>
                <Input
                  id="stock"
                  type="number"
                  step="1"
                  value={product?.stock}
                  onChange={(e) =>
                    updateProduct(
                      "stock",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                />
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

            <div className="gap-2">
              <Label>Moneda de Venta</Label>
              <Select
                value={selectedMoneda}
                onValueChange={(v) => {
                  setSelectedMoneda(v);
                  updateProduct("default_moneda", v); // si quieres persistir inmediatamente
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una moneda" />
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
            <div className="gap-2 flex flex-col items-start">
              <Label>Visible en Tienda</Label>
              <Switch
                checked={product?.visible}
                onCheckedChange={() =>
                  updateProduct("visible", !product?.visible)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Addons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Agregados del Producto
            <Button variant="outline" size="sm" onClick={addAddon}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Extra
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(product?.agregados || []).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay agregados configurados. Los agregados permiten a los
              clientes personalizar el producto con extras adicionales.
            </p>
          ) : (
            <div className="space-y-4">
              {(product?.agregados || []).map((addon, index) => (
                <div key={addon.id} className="border rounded-lg p-4 space-y-3">
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
                      <Label>Precio Completo ($)</Label>
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
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Doble espacio</Label>
              <Switch
                checked={product?.span}
                onCheckedChange={() => updateProduct("visible", !product?.span)}
              />
            </div>

            <div className="flex flex-col  gap-2">
              <Label>Producto de venta</Label>
              <Switch
                checked={product?.venta}
                onCheckedChange={() => updateProduct("venta", !product?.venta)}
              />
            </div>
          </div>

          <div>
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {product?.caracteristicas.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta"
              />
              <Button variant="outline" onClick={addTag}>
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function arraysEqual(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

"use client";

import React, { useContext } from "react";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Plus, Trash2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ThemeContext } from "@/context/useContext";
import { Switch } from "@/components/ui/switch";

export function QuickEssentials({
  product,
  currencies,
  categories,
  imageBlob,
  onTitleChange,
  onCategoryChange,
  onCurrencyChange,
  onPriceChange,
  onOldPriceChange,
  onImageSelect,
  onCreateCategory,
  stock,
  priceCompra,
  embalaje,
  onStockChange,
  onPriceCompraChange,
  onEmbajajeChange,
}) {
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { webshop } = useContext(ThemeContext);

  const defaultVariant =
    product.product_variants.find((v) => v.default_variant) ??
    product.product_variants[0];

  useEffect(() => {
    if (!imageBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  const displayImage = previewUrl ?? defaultVariant?.image ?? null;

  const currency = currencies.find((c) => c.id === product.default_moneda);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) onImageSelect(file);
  };

  const submitNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await onCreateCategory(name);
    setNewCategoryName("");
    setCreatingCategory(false);
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
            <Camera size={13} />
          </span>
          <div>
            <h2 className="text-sm sm:text-[15px] font-semibold text-foreground leading-tight">
              Esencial
            </h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Lo mínimo para publicar tu producto
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:block">
          Paso 1
        </span>
      </div>

      <div className="grid gap-4 sm:gap-5 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr]">
        {/* Imagen */}
        <div>
          {displayImage ? (
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary group">
              <Image
                src={displayImage || "/placeholder.svg"}
                alt={product.title || "Producto"}
                fill
                sizes="(min-width: 768px) 220px, 180px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-end justify-between gap-1 p-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-[11px] font-medium px-2.5 h-7 rounded-md bg-background/95 text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                  <Upload size={11} /> Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => onImageSelect(null)}
                  aria-label="Quitar imagen"
                  className="w-7 h-7 rounded-md bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              {previewUrl && (
                <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  Sin guardar
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={cn(
                "aspect-square w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30 hover:bg-accent/40 hover:border-primary/40",
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                <Upload
                  size={16}
                  className={
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }
                />
              </div>
              <p className="text-[13px] font-medium text-foreground">
                Subir imagen
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Arrastrá o hacé clic
                <br />
                <span className="text-muted-foreground/70">
                  Opcional · PNG, JPG hasta 10MB
                </span>
              </p>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImageSelect(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Datos */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="qe-title"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                Nombre del producto
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {product.title.length}/60
              </span>
            </div>
            <Input
              id="qe-title"
              value={product.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej: Labial mate larga duración"
              maxLength={60}
              className="h-12 text-base sm:text-[15px] rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="qe-price"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Precio
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {currency?.simbolo ?? "$"}
                </span>
                <Input
                  id="qe-price"
                  type="number"
                  inputMode="decimal"
                  value={defaultVariant?.price || ""}
                  onChange={(e) => {
                    const currentPrice = Number(defaultVariant?.price) || 0;
                    const newPrice = Number.parseFloat(e.target.value) || 0;
                    // Solo capturar old_price cuando el precio baja
                    if (newPrice < currentPrice && currentPrice > 0) {
                      onOldPriceChange(currentPrice);
                    }
                    onPriceChange(newPrice);
                  }}
                  placeholder="0"
                  className="h-11 rounded-xl pl-7 text-[15px] font-semibold tabular-nums"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="qe-price"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Stock
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="relative">
                {webshop.store.stocks ? (
                  <Input
                    id="qe-price"
                    type="number"
                    inputMode="decimal"
                    value={defaultVariant?.stock || ""}
                    onChange={(e) =>
                      onStockChange(Number.parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="h-11 rounded-xl pl-7 text-[15px] font-semibold tabular-nums"
                  />
                ) : (
                  <Switch
                    checked={defaultVariant?.stock > 0}
                    onCheckedChange={(checked) =>
                      onStockChange(checked ? 1 : 0)
                    }
                  />
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="qe-currency"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Moneda
              </label>
              <Select
                value={product.default_moneda}
                onValueChange={onCurrencyChange}
              >
                <SelectTrigger id="qe-currency" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="qe-price"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Precio de Compra
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="relative">
                <Input
                  id="qe-price"
                  type="number"
                  inputMode="decimal"
                  value={defaultVariant?.priceCompra || ""}
                  onChange={(e) =>
                    onPriceCompraChange(Number.parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="h-11 rounded-xl pl-7 text-[15px] font-semibold tabular-nums"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="qe-price"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Embalaje
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="relative">
                <Input
                  id="qe-price"
                  type="number"
                  inputMode="decimal"
                  value={defaultVariant?.embalaje || ""}
                  onChange={(e) =>
                    onEmbajajeChange(Number.parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="h-11 rounded-xl pl-7 text-[15px] font-semibold tabular-nums"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="qe-category"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Categoría
                <span className="text-destructive ml-0.5">*</span>
              </label>

              {!creatingCategory ? (
                <div className="flex gap-2">
                  <Select
                    value={product.caja ?? undefined}
                    onValueChange={onCategoryChange}
                  >
                    <SelectTrigger id="qe-category" className="h-11 rounded-xl">
                      <SelectValue placeholder="Seleccioná una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setCreatingCategory(true)}
                    className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                    aria-label="Crear nueva categoría"
                    title="Crear nueva"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitNewCategory();
                      } else if (e.key === "Escape") {
                        setCreatingCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    placeholder="Nombre de la nueva categoría"
                    className="h-11 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={submitNewCategory}
                    disabled={!newCategoryName.trim()}
                    className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

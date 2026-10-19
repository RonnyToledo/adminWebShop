"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProductImage, useObjectUrl, validateImageFile } from "./image-utils";
import { ThemeContext } from "@/context/useContext";
import { Switch } from "@/components/ui/switch";

// ── Descarga una URL de imagen y la convierte en File (blob) ───────────────
// El navegador no puede leer el contenido de una imagen cross-origin salvo
// que el servidor de origen mande Access-Control-Allow-Origin (algo que no
// controlamos). Por eso la descarga se hace server-side, vía
// /api/proxy-image, que no tiene esa restricción al ser servidor-a-servidor.
async function urlToFile(url) {
  let response;
  try {
    response = await fetch("/api/proxy-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new Error(
      "No se pudo contactar al servidor para descargar la imagen",
    );
  }

  if (!response.ok) {
    let message = "No se pudo descargar la imagen desde esa URL";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // respuesta sin JSON (ej. 502 de red cruda) → dejamos el mensaje genérico
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("La URL no apunta a una imagen válida");
  }
  const extension = blob.type.split("/")[1] || "jpg";
  const filename = `image_from_url_${Date.now()}.${extension}`;
  return new File([blob], filename, { type: blob.type });
}

// ── Input decimal seguro para móviles ──────────────────────────────────────
// Mantiene el texto que escribe el usuario ("1.", "1,5", "0.") en estado
// local y solo notifica al padre el número ya parseado. Así no se pierde el
// separador decimal al re-renderizar. Sincroniza desde el prop solo cuando
// el input no tiene el foco (cambios externos, reset del formulario, etc.).
function DecimalInput({
  id,
  value,
  onValueChange,
  placeholder = "0",
  className,
}) {
  const toText = (v) => ((v || v === 0) && Number(v) !== 0 ? String(v) : "");
  const [text, setText] = useState(toText(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(toText(value));
  }, [value]);

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      placeholder={placeholder}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setText(toText(value));
      }}
      onChange={(e) => {
        // quita espacios y acepta coma como separador decimal
        const raw = e.target.value.replace(/\s/g, "").replace(",", ".");
        // solo dígitos y un punto
        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
        setText(raw);
        onValueChange(Number.parseFloat(raw) || 0);
      }}
      className={className}
    />
  );
}

export function QuickEssentials({
  product,
  currencies,
  categories,
  imageBlob,
  imageUrl,
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
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // ── Estado del modo "pegar URL" ───────────────────────────────────────────
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);

  const { webshop } = useContext(ThemeContext);

  const defaultVariant =
    product.product_variants.find((v) => v.default_variant) ??
    product.product_variants[0];

  const previewUrl = useObjectUrl(imageBlob);

  const displayImage = previewUrl ?? imageUrl ?? defaultVariant?.image ?? null;

  const currency = currencies.find((c) => c.id === product.default_moneda);

  // Precio antiguo: manual, sin cálculo automático.
  const currentPrice = Number(defaultVariant?.price) || 0;
  const currentOldPrice =
    Number(defaultVariant?.old_price ?? defaultVariant?.oldPrice) || 0;
  const oldPriceInvalid =
    currentOldPrice > 0 && currentOldPrice <= currentPrice;

  // Valida (tipo/tamaño) y avisa con toast. Devuelve true si se aceptó.
  const selectFile = (file) => {
    if (!file || !validateImageFile(file)) return false;
    onImageSelect(file);
    toast.success("Imagen seleccionada", {
      description: "Se subirá cuando guardes el producto.",
    });
    return true;
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
    toast.info("Imagen quitada");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const submitNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || isCreatingCategory || typeof onCreateCategory !== "function")
      return;

    setIsCreatingCategory(true);
    try {
      await onCreateCategory(name);
      setNewCategoryName("");
      setCreatingCategory(false);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const openUrlMode = () => {
    setUrlError(null);
    setUrlValue("");
    setUrlMode(true);
  };

  const cancelUrlMode = () => {
    setUrlMode(false);
    setUrlValue("");
    setUrlError(null);
  };

  const submitUrlImage = async () => {
    const url = urlValue.trim();
    if (!url || isFetchingUrl) return;

    setIsFetchingUrl(true);
    setUrlError(null);
    try {
      const file = await urlToFile(url);
      if (selectFile(file)) {
        setUrlMode(false);
        setUrlValue("");
      }
    } catch (err) {
      const message = err.message || "No se pudo cargar la imagen";
      setUrlError(message);
      toast.error("No se pudo cargar la imagen", { description: message });
    } finally {
      setIsFetchingUrl(false);
    }
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
          {urlMode ? (
            <div className="aspect-square w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-2.5 px-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                {isFetchingUrl ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <Link2 size={16} className="text-primary" />
                )}
              </div>
              <p className="text-[13px] font-medium text-foreground">
                Pegá la URL de la imagen
              </p>
              <Input
                autoFocus
                value={urlValue}
                disabled={isFetchingUrl}
                onChange={(e) => {
                  setUrlValue(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitUrlImage();
                  } else if (e.key === "Escape") {
                    cancelUrlMode();
                  }
                }}
                placeholder="https://..."
                className="h-10 rounded-xl text-[13px] bg-background"
              />
              {urlError && (
                <p className="text-[11px] text-destructive leading-tight">
                  {urlError}
                </p>
              )}
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={submitUrlImage}
                  disabled={!urlValue.trim() || isFetchingUrl}
                  className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-all"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Usar imagen"
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelUrlMode}
                  disabled={isFetchingUrl}
                  className="h-9 px-3 rounded-lg border border-border text-[12px] text-muted-foreground hover:bg-accent transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : displayImage ? (
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary group">
              <ProductImage
                src={displayImage}
                alt={product.title || "Producto"}
                sizes="(min-width: 768px) 220px, 180px"
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
                  onClick={handleRemoveImage}
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

          {/* Alternativa: pegar una URL en vez de subir el archivo */}
          {!urlMode && (
            <button
              type="button"
              onClick={openUrlMode}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link2 size={11} />O pegar una URL de imagen
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
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
                {typeof onCreateCategory === "function" && (
                  <button
                    type="button"
                    onClick={() => setCreatingCategory(true)}
                    className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                    aria-label="Crear nueva categoría"
                    title="Crear nueva"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "flex gap-2 transition-opacity duration-300",
                  isCreatingCategory && "opacity-80",
                )}
              >
                <Input
                  autoFocus
                  value={newCategoryName}
                  disabled={isCreatingCategory}
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
                  disabled={!newCategoryName.trim() || isCreatingCategory}
                  className={cn(
                    "w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-all",
                    isCreatingCategory && "animate-pulse",
                  )}
                  aria-label={
                    isCreatingCategory
                      ? "Creando categoría"
                      : "Guardar categoría"
                  }
                >
                  {isCreatingCategory ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
                <button
                  type="button"
                  disabled={isCreatingCategory}
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* Precio */}
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
                <DecimalInput
                  id="qe-price"
                  value={defaultVariant?.price}
                  onValueChange={onPriceChange}
                  className="h-11 rounded-xl pl-7 text-[15px] font-semibold tabular-nums"
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label
                htmlFor="qe-stock"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Stock
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="relative">
                {webshop?.store?.stocks ? (
                  <Input
                    id="qe-stock"
                    type="number"
                    inputMode="numeric"
                    value={defaultVariant?.stock || ""}
                    onChange={(e) =>
                      onStockChange(Number.parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="h-11 rounded-xl px-3 text-[15px] font-semibold tabular-nums"
                  />
                ) : (
                  <Switch
                    id="qe-stock"
                    checked={defaultVariant?.stock > 0}
                    onCheckedChange={(checked) =>
                      onStockChange(checked ? 1 : 0)
                    }
                  />
                )}
              </div>
            </div>

            {/* Moneda */}
            <div>
              <label
                htmlFor="qe-currency"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Moneda
              </label>
              <Select
                value={String(product.default_moneda ?? "")}
                onValueChange={(v) => onCurrencyChange(Number(v))}
              >
                <SelectTrigger id="qe-currency" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio de compra */}
            <div>
              <label
                htmlFor="qe-price-compra"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Precio de Compra
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="relative">
                <DecimalInput
                  id="qe-price-compra"
                  value={defaultVariant?.priceCompra}
                  onValueChange={onPriceCompraChange}
                  className="h-11 rounded-xl px-3 text-[15px] font-semibold tabular-nums"
                />
              </div>
            </div>

            {/* Embalaje */}
            <div>
              <label
                htmlFor="qe-embalaje"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Embalaje
              </label>
              <div className="relative">
                <DecimalInput
                  id="qe-embalaje"
                  value={defaultVariant?.embalaje}
                  onValueChange={onEmbajajeChange}
                  className="h-11 rounded-xl px-3 text-[15px] font-semibold tabular-nums"
                />
              </div>
            </div>

            {/* Precio antiguo (manual) */}
            <div>
              <label
                htmlFor="qe-old-price"
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Precio Antiguo
              </label>
              <div className="relative">
                <DecimalInput
                  id="qe-old-price"
                  value={defaultVariant?.old_price ?? defaultVariant?.oldPrice}
                  onValueChange={onOldPriceChange}
                  className={cn(
                    "h-11 rounded-xl px-3 text-[15px] font-semibold tabular-nums",
                    oldPriceInvalid &&
                      "border-amber-500 focus-visible:ring-amber-500/30",
                  )}
                />
              </div>
              {oldPriceInvalid ? (
                <p className="mt-1 text-[10px] text-amber-600 leading-tight">
                  Debería ser mayor que el precio actual
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-muted-foreground/70 leading-tight">
                  Opcional · para mostrar el descuento
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

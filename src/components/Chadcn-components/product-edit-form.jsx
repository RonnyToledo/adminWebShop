"use client";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, AlertCircle, Eye, Loader, X, Info, Trash2 } from "lucide-react";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import ImageUploadDrag from "../component/ImageDND";
import { v4 as uuidv4 } from "uuid";
import SecondaryImagesManager from "./Specific/secondaryImagesManager";
import { sileo } from "sileo";
import Image from "next/image";
import axios from "axios";

// ─── Sección reutilizable ─────────────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div className="bg-background border border-border rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, hint, counter, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium">
          {label}
        </label>
        {counter !== undefined && (
          <span
            className={`text-[10px] ${counter > 55 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {counter}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── SwitchRow ────────────────────────────────────────────────────────────────
function SwitchRow({ label, desc, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20">
      <div>
        <p className="text-sm font-medium text-foreground leading-tight">
          {label}
        </p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
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
  const [newCategory, setNewCategory] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);

  // ── lógica sin cambios ──────────────────────────────────────────────────────

  const updateProduct = (field, value) => {
    if (field === "price") {
      onProductChange({
        ...product,
        price: value,
        oldPrice: product.oldPrice > value ? product.oldPrice : 0,
      });
    }
    onProductChange({ ...product, [field]: value });
  };

  useEffect(() => {
    if (
      product?.default_moneda !== undefined &&
      product?.default_moneda !== null
    ) {
      setSelectedMoneda(
        webshop?.store?.monedas.find((c) => c.id === product?.default_moneda)
          ?.id
          ? product?.default_moneda
          : (webshop?.store?.monedas.find((c) => c.defecto)?.nombre ?? ""),
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
      sileo.error({
        title: "Error",
        description: "Etiqueta ya creada o inválida",
      });
    }
  };
  const removeTag = (tag) =>
    updateProduct(
      "caracteristicas",
      product?.caracteristicas.filter((t) => t !== tag),
    );

  const addAddon = () =>
    updateProduct("agregados", [
      ...product?.agregados,
      { id: uuidv4(), name: "", price: 0 },
    ]);
  const updateAddon = (id, field, value) =>
    updateProduct(
      "agregados",
      product?.agregados.map((a) =>
        a.id === id ? { ...a, [field]: value } : a,
      ),
    );
  const removeAddon = (id) =>
    updateProduct(
      "agregados",
      product?.agregados.filter((a) => a.id !== id),
    );

  const handleImagesChange = useCallback((newImages) => {
    onProductChange((prev) => {
      const prevImgs = Array.isArray(prev?.imagesecondary)
        ? prev?.imagesecondary
        : [];
      if (arraysEqual(prevImgs, newImages)) return prev;
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
    setLoadingCategory(true);
    if (!newCategory?.trim()) {
      sileo.error({
        title: "Error",
        description: "Debes indicar el nombre de la categoría.",
      });
      return;
    }
    if (!webshop?.store?.sitioweb || !webshop?.store?.UUID) {
      sileo.error({
        title: "Error",
        description: "Información de la tienda incompleta.",
      });
      return;
    }
    const payload = {
      name: newCategory,
      storeId: webshop.store.UUID,
      order: webshop.store?.category?.length ?? 0,
    };
    const postPromise = axios.post(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      payload,
      { headers: { "Content-Type": "application/json" } },
    );
    try {
      sileo.promise(postPromise, {
        loading: { title: "Creando categoría..." },
        success: (response) => {
          const cat = response?.data?.data ?? response?.data ?? null;
          if (cat) {
            updateProduct("caja", cat?.id);
            setWebshop((prev) => ({
              ...prev,
              store: {
                ...prev.store,
                categoria: [...(prev.store.categoria ?? []), cat],
              },
            }));
          }
          setNewCategory("");
          return { title: response?.data?.message ?? "Categoría creada" };
        },
        error: (err) => ({
          title: "Error",
          description: err?.response?.data?.message ?? err?.message,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setShowCategoryInput(false);
      setLoadingCategory(false);
    }
  };

  const marginPercentage = (() => {
    const cost = Number(product?.priceCompra) || 0;
    const price = Number(product?.price) || 0;
    if (cost <= 0 || price <= 0) return 0;
    const raw = ((price - cost) / price) * 100;
    if (!isFinite(raw) || Number.isNaN(raw)) return 0;
    return Math.max(0, Math.min(99.99, Number(raw.toFixed(2))));
  })();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Banner cambios sin guardar */}
      {changes && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" />
          Cambios sin guardar
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Información básica ─────────────────────────────────────────── */}
        <Section title="Información básica">
          <Field label="Título" counter={`${product?.title?.length || 0}/60`}>
            <Input
              placeholder="Ej: Café Frapuchino"
              value={product?.title || ""}
              onChange={(e) => updateProduct("title", e.target.value)}
              maxLength={60}
            />
          </Field>

          <Field
            label="Descripción"
            counter={`${product?.descripcion?.length || 0}/500`}
          >
            <Textarea
              placeholder="Describe tu producto..."
              rows={5}
              className="resize-none text-xs"
              value={product?.descripcion || ""}
              onChange={(e) => updateProduct("descripcion", e.target.value)}
              maxLength={500}
            />
          </Field>

          <Field label="Categoría" hint="Ayuda a organizar tus productos">
            {!showCategoryInput ? (
              <div className="flex gap-2">
                <Select
                  value={product?.caja}
                  onValueChange={(v) => updateProduct("caja", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {webshop?.store?.categoria.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setShowCategoryInput(true)}
                  disabled={loadingCategory}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loadingCategory}
                  onClick={addCategory}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors"
                >
                  {loadingCategory ? (
                    <Loader size={13} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
                <button
                  type="button"
                  disabled={loadingCategory}
                  onClick={() => setShowCategoryInput(false)}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </Field>
        </Section>

        {/* ── Imágenes ───────────────────────────────────────────────────── */}
        <Section title="Imágenes" description="Agrega fotos de alta calidad">
          <Field label="Imagen principal">
            {newImage ? (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-square">
                <Image
                  alt="Principal"
                  fill
                  src={URL.createObjectURL(newImage)}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setNewImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-destructive/90 flex items-center justify-center text-white hover:bg-destructive transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : !deleteOriginal && product?.image ? (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-square">
                <Image
                  src={product?.image || logoApp}
                  alt={product?.title || ""}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDeleteOriginal(true)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-destructive/90 flex items-center justify-center text-white hover:bg-destructive transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <div>
                <ImageUploadDrag
                  setImageNew={setNewImage}
                  imageNew={newImage}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Primera imagen visible para los clientes
                </p>
              </div>
            )}
          </Field>

          <Field
            label={`Imágenes adicionales (${product?.imagesecondary?.length || 0}/3)`}
          >
            <SecondaryImagesManager
              initialImages={product?.imagesecondary || []}
              onChange={handleImagesChange}
              onChangeClean={handleImagesChangeClean}
              maxImages={3}
            />
            <p className="text-[11px] text-muted-foreground">
              Muestra diferentes ángulos del producto
            </p>
          </Field>
        </Section>

        {/* ── Precios ────────────────────────────────────────────────────── */}
        <Section
          title="Precios e inventario"
          description="Gestiona precios, costos y disponibilidad"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio de venta *">
              <Input
                type="number"
                placeholder="0"
                value={product?.price || ""}
                onChange={(e) =>
                  updateProduct("price", parseFloat(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Inversión">
              <Input
                type="number"
                placeholder="0"
                value={product?.priceCompra || ""}
                onChange={(e) =>
                  updateProduct("priceCompra", parseFloat(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Embalaje">
              <Input
                type="number"
                placeholder="0"
                value={product?.embalaje || ""}
                onChange={(e) =>
                  updateProduct("embalaje", parseFloat(e.target.value) || 0)
                }
              />
            </Field>
            {webshop?.store?.stocks ? (
              <Field label="Stock">
                <Input
                  type="number"
                  placeholder="1"
                  value={product?.stock || ""}
                  onChange={(e) =>
                    updateProduct("stock", parseFloat(e.target.value) || 0)
                  }
                />
              </Field>
            ) : (
              <Field label="En stock">
                <div className="pt-2">
                  <Switch
                    checked={!!product?.stock}
                    onCheckedChange={() =>
                      updateProduct("stock", product?.stock ? 0 : 1)
                    }
                  />
                </div>
              </Field>
            )}
          </div>

          {/* Ganancia */}
          {product?.priceCompra > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Info size={13} className="text-primary" /> Ganancia
                </div>
                <div className="text-right">
                  <span className="text-xl font-medium text-primary tabular-nums">
                    {Number(
                      ((product?.price - product?.priceCompra) /
                        product?.price) *
                        100,
                    ).toFixed(1)}
                    %
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {Number(product?.price - product?.priceCompra).toFixed(2)}{" "}
                    de ganancia
                  </p>
                </div>
              </div>
              <Slider
                value={[marginPercentage]}
                max={99.99}
                min={0}
                step={0.1}
                onValueChange={(value) => {
                  const val = Array.isArray(value) ? value[0] : value;
                  let p = Number(val) || 0;
                  if (p >= 99.99) p = 99.99;
                  const cost = Number(product?.priceCompra) || 0;
                  const denom = 1 - p / 100;
                  const newPrice = cost > 0 && denom > 0 ? cost / denom : cost;
                  updateProduct("price", Number(newPrice.toFixed(2)) || 0);
                }}
              />
            </div>
          )}

          <Field label="Moneda de venta">
            <Select
              value={selectedMoneda}
              onValueChange={(v) => {
                setSelectedMoneda(v);
                updateProduct("default_moneda", v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {webshop?.store?.monedas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        {/* ── Detalles adicionales ───────────────────────────────────────── */}
        <Section
          title="Detalles adicionales"
          description="Configuraciones opcionales"
        >
          <SwitchRow
            label="Doble espacio"
            desc="Más espacio en el listado"
            checked={!!product?.span}
            onCheckedChange={() => updateProduct("visible", !product?.span)}
          />
          <SwitchRow
            label="Producto de venta"
            desc="Disponible para compra"
            checked={!!product?.venta}
            onCheckedChange={() => updateProduct("venta", !product?.venta)}
          />
          <SwitchRow
            label="Visible en tienda"
            desc="Los clientes pueden verlo"
            checked={!!product?.visible}
            onCheckedChange={() => updateProduct("visible", !product?.visible)}
          />

          <Field
            label="Etiquetas"
            hint="Las etiquetas ayudan a filtrar y buscar productos"
          >
            <div className="flex gap-2">
              <Input
                placeholder="Ej: nuevo, oferta..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground hover:bg-secondary/70 transition-colors shrink-0"
              >
                Agregar
              </button>
            </div>
            {product?.caracteristicas?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {product.caracteristicas.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-xs bg-secondary border border-border text-foreground px-2.5 py-1 rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </Field>
        </Section>

        {/* ── Agregados ─────────────────────────────────────────────────── */}
        <Section
          title="Agregados del producto"
          description="Opciones extras que los clientes pueden añadir"
        >
          {(product?.agregados || []).length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Plus size={18} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sin agregados configurados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {product?.agregados.map((addon, i) => (
                <div
                  key={addon.id}
                  className="border border-border rounded-xl p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-[0.08em]">
                      Agregado #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAddon(addon.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={addon.name}
                      onChange={(e) =>
                        updateAddon(addon.id, "name", e.target.value)
                      }
                      placeholder="Nombre del extra"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={addon.price}
                      onChange={(e) =>
                        updateAddon(
                          addon.id,
                          "price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addAddon}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-xl py-3 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus size={13} /> Agregar extra
          </button>
        </Section>

        {/* ── Consejos ──────────────────────────────────────────────────── */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
            <Info size={12} className="text-primary" /> Consejos rápidos
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {[
              "Usa imágenes de alta calidad con fondo blanco",
              "Escribe descripciones claras y detalladas",
              "Revisa los precios antes de publicar",
              "Usa etiquetas relevantes para mejor búsqueda",
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5">
                <span className="text-primary mt-0.5">·</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
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

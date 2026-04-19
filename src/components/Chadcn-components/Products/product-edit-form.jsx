"use client";
import React, { useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  AlertCircle,
  Loader,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  ShoppingBag,
  Maximize2,
  Loader2,
} from "lucide-react";
import { ThemeContext } from "@/context/useContext";
import { sileo } from "sileo";
import apiClient from "@/lib/apiClient";
import VariantsManager, { makeDefaultVariant } from "./VariantsManager";
import PlanGuard from "../Planes/PlanGuard";

// ─── Wizard steps ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: "info", label: "Información" },
  { id: "pricing", label: "Precio & foto & Variantes" },
];

// ─── Helpers de layout ────────────────────────────────────────────────────────

function Field({ label, hint, counter, required, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-destructive text-xs">*</span>}
        </label>
        {counter !== undefined && (
          <span
            className={`text-[10px] ${
              counter > 55 ? "text-destructive" : "text-muted-foreground"
            }`}
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

function SwitchRow({ label, desc, checked, onCheckedChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={15} className="text-muted-foreground shrink-0" />}
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">
            {label}
          </p>
          {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Card({ title, description, children }) {
  return (
    <div className="bg-background border border-border rounded-xl p-5 space-y-4">
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, visitedSteps, onStepClick }) {
  return (
    <div className="flex items-center border border-border rounded-xl overflow-hidden bg-secondary/20 mb-4">
      {STEPS.map(({ id, label }, idx) => {
        const isActive = idx === currentStep;
        const isDone = visitedSteps.has(idx) && idx !== currentStep;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onStepClick(idx)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-xs font-medium
              border-r border-border last:border-r-0 transition-all cursor-pointer
              ${
                isActive
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }
            `}
          >
            <span
              className={`
              w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 transition-all
              ${
                isDone
                  ? "bg-green-500 text-white"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-border/60 text-muted-foreground"
              }
            `}
            >
              {isDone ? <Check size={9} /> : idx + 1}
            </span>
            <span className="hidden sm:inline truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({ currentStep }) {
  const pct = Math.round(((currentStep + 1) / STEPS.length) * 100);
  return (
    <div className="w-full h-0.5 bg-secondary rounded-full overflow-hidden mb-4">
      <div
        className="h-full bg-primary rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Panel 1: Información ─────────────────────────────────────────────────────

function PanelInfo({ product, updateProduct, webshop, setWebshop }) {
  const [newTag, setNewTag] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || product?.caracteristicas?.includes(tag)) {
      sileo.error({
        title: "Error",
        description: "Etiqueta ya creada o inválida",
      });
      return;
    }
    updateProduct("caracteristicas", [
      ...(product?.caracteristicas ?? []),
      tag,
    ]);
    setNewTag("");
  };

  const removeTag = (tag) =>
    updateProduct(
      "caracteristicas",
      product.caracteristicas.filter((t) => t !== tag),
    );

  const addCategory = async () => {
    if (!newCategory?.trim()) {
      sileo.error({
        title: "Error",
        description: "Debes indicar el nombre de la categoría.",
      });
      return;
    }
    setLoadingCategory(true);
    const payload = {
      name: newCategory,
      storeId: webshop.store.UUID,
      order: webshop.store?.categoria?.length ?? 0,
    };
    const postPromise = apiClient.post(
      `/api/tienda/${webshop.store.sitioweb}/categoria`,
      payload,
    );
    try {
      sileo.promise(postPromise, {
        loading: { title: "Creando categoría..." },
        success: (res) => {
          const cat = res?.data?.data ?? res?.data ?? null;
          if (cat) {
            updateProduct("caja", cat.id);
            setWebshop((prev) => ({
              ...prev,
              store: {
                ...prev.store,
                categoria: [...(prev.store.categoria ?? []), cat],
              },
            }));
          }
          setNewCategory("");
          return { title: res?.data?.message ?? "Categoría creada" };
        },
        error: (err) => ({
          title: "Error",
          description: err?.response?.data?.message ?? err?.message,
        }),
      });
    } finally {
      setShowCategoryInput(false);
      setLoadingCategory(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card title="Datos del producto">
        <Field
          label="Nombre del producto"
          required
          counter={`${product?.title?.length || 0}/60`}
        >
          <Input
            placeholder="Ej: Labial en forma de crayola"
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
            placeholder="Describe tu producto: materiales, beneficios, modo de uso..."
            rows={5}
            className="resize-none text-xs"
            value={product?.descripcion || ""}
            onChange={(e) => updateProduct("descripcion", e.target.value)}
            maxLength={500}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría" required>
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
                    {webshop?.store?.categoria?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setShowCategoryInput(true)}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0"
                  title="Crear nueva categoría"
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  disabled={loadingCategory}
                  onClick={addCategory}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"
                >
                  {loadingCategory ? (
                    <Loader size={13} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryInput(false)}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </Field>

          <Field label="Moneda de venta">
            <Select
              value={product?.default_moneda ?? ""}
              onValueChange={(v) => updateProduct("default_moneda", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {webshop?.store?.monedas?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card title="Visibilidad y opciones">
        <div className="space-y-2">
          <SwitchRow
            label="Visible en tienda"
            desc="Los clientes pueden ver este producto"
            checked={!!product?.visible}
            onCheckedChange={() => updateProduct("visible", !product?.visible)}
            icon={product?.visible ? Eye : EyeOff}
          />
          <SwitchRow
            label="Disponible para compra"
            desc="Aparece con botón de comprar"
            checked={!!product?.venta}
            onCheckedChange={() => updateProduct("venta", !product?.venta)}
            icon={ShoppingBag}
          />
          <SwitchRow
            label="Destacado (doble espacio)"
            desc="Ocupa más espacio en el listado"
            checked={!!product?.span}
            onCheckedChange={() => updateProduct("span", !product?.span)}
            icon={Maximize2}
          />
        </div>
      </Card>

      <Card title="Etiquetas" description="Ayudan a filtrar y buscar productos">
        <div className="flex gap-2">
          <Input
            placeholder="Ej: nuevo, oferta, verano..."
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
            className="px-4 py-2 rounded-xl bg-secondary border border-border text-sm shrink-0 hover:bg-secondary/70 transition-colors"
          >
            Agregar
          </button>
        </div>
        {(product?.caracteristicas?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {product.caracteristicas.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="text-xs bg-secondary border border-border text-foreground px-2.5 py-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                {tag} ×
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Panel 2: Precio & foto & Variantes ──────────────────────────────────────
// Pasa el array COMPLETO a VariantsManager — nunca filtrado.

function PanelPricing({
  product,
  onProductChange,
  variantImageBlobs,
  setVariantImageBlobs,
}) {
  return (
    <div className="space-y-3">
      <Card
        title="Foto, precio y variantes"
        description="Configura la imagen, precio y stock. Si el producto tiene colores, tallas u otras opciones, actívalas desde aquí."
      >
        <VariantsManager
          variants={product?.product_variants ?? []}
          onChange={(variants) =>
            onProductChange((prev) => ({ ...prev, product_variants: variants }))
          }
          variantImageBlobs={variantImageBlobs}
          setVariantImageBlobs={setVariantImageBlobs}
        />
      </Card>
    </div>
  );
}

// ─── ProductEditForm ──────────────────────────────────────────────────────────
// Props:
//   product, onProductChange — igual que siempre
//   changes                  — banner "cambios sin guardar"
//   variantImageBlobs, setVariantImageBlobs — Map vive en Specific / NewProduct
//   SaveData                 — función de guardado del padre
//   downloading              — boolean de estado de guardado

export function ProductEditForm({
  product,
  onProductChange,
  changes = false,
  variantImageBlobs,
  setVariantImageBlobs,
  SaveData,
  downloading,
}) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set());

  // Moneda por defecto al montar
  useEffect(() => {
    if (product?.default_moneda != null) {
      const match = webshop?.store?.monedas?.find(
        (c) => c.id === product.default_moneda,
      );
      if (!match) {
        const fallback =
          webshop?.store?.monedas?.find((c) => c.defecto)?.id ?? "";
        if (fallback)
          onProductChange((prev) => ({ ...prev, default_moneda: fallback }));
      }
    }
  }, [product?.default_moneda]); // eslint-disable-line react-hooks/exhaustive-deps

  // Asegurar al menos una variante default
  useEffect(() => {
    const variants = product?.product_variants ?? product?.variants ?? [];
    if (variants.length === 0) {
      onProductChange((prev) => ({
        ...prev,
        product_variants: [makeDefaultVariant(0, 0, 0)],
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProduct = (field, value) =>
    onProductChange((prev) => ({ ...prev, [field]: value }));

  const goStep = (idx) => {
    if (idx < 0 || idx >= STEPS.length) return;
    setVisitedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-0">
      {changes && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          <AlertCircle size={14} className="shrink-0" />
          Cambios sin guardar
        </div>
      )}

      <ProgressBar currentStep={currentStep} />

      <StepIndicator
        currentStep={currentStep}
        visitedSteps={visitedSteps}
        onStepClick={goStep}
      />

      {currentStep === 0 && (
        <PanelInfo
          product={product}
          updateProduct={updateProduct}
          webshop={webshop}
          setWebshop={setWebshop}
        />
      )}

      {currentStep === 1 && (
        <PanelPricing
          product={product}
          onProductChange={onProductChange}
          variantImageBlobs={variantImageBlobs}
          setVariantImageBlobs={setVariantImageBlobs}
        />
      )}

      {/* Navegación */}
      <div className="sticky bottom-0 bg-white flex items-center justify-between mt-4 p-4 border-t border-border">
        <button
          type="button"
          onClick={() => goStep(currentStep - 1)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-secondary/60 ${
            currentStep === 0 ? "invisible pointer-events-none" : ""
          }`}
        >
          <ChevronLeft size={15} /> Atrás
        </button>

        <span className="text-xs text-muted-foreground">
          Paso {currentStep + 1} de {STEPS.length}
        </span>

        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => goStep(currentStep + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Continuar <ChevronRight size={15} />
          </button>
        ) : (
          <PlanGuard feature="productos">
            <button
              type="button"
              onClick={() => SaveData()}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Check size={13} /> Guardar
                </>
              )}
            </button>
          </PlanGuard>
        )}
      </div>
    </div>
  );
}

export default ProductEditForm;

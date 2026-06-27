"use client";

import React from "react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Eye,
  Layers,
  Sparkles,
  Tag as TagIcon,
} from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import { QuickEssentials } from "./quick-essentials";
import { SaveBar } from "./save-bar";
import { SectionCard } from "./section-card";
import { CombosSection } from "./sections/combos-section";
import { InfoSectionsEditor } from "./sections/info-sections";
import { TagsSection } from "./sections/tags-section";
import { VisibilitySection } from "./sections/visibility-section";
import VariantsManager, { makeDefaultVariant } from "./VariantsManager";

import { ThemeContext } from "@/context/useContext";

// ─── ProductEditForm ──────────────────────────────────────────────────────────

export function ProductEditForm({
  product,
  onProductChange,
  hasChanges = false,
  saving,
  variantImageBlobs,
  setVariantImageBlobs,
  currencies: currenciesProp,
  categories: categoriesProp,
  peers: peersProp,
  onSave,
  onCreateCategory,
}) {
  const { webshop } = useContext(ThemeContext);

  // Fallback a webshop si no vienen por props (compatible con Specific.jsx)
  const currencies = currenciesProp ?? webshop?.store?.monedas ?? [];
  const categories = categoriesProp ?? webshop?.store?.categoria ?? [];
  const peers = peersProp ?? webshop?.products ?? [];

  // Asegurar al menos una variante default al montar
  useEffect(() => {
    const variants = product?.product_variants ?? [];
    if (variants.length === 0) {
      onProductChange((prev) => ({
        ...prev,
        product_variants: [makeDefaultVariant(0, 0, 0)],
      }));
    }
  }, [product?.product_variants?.length]);

  // Modo rápido/detallado: si ya tiene datos avanzados, abrir en detallado
  const hasAdvancedData = useMemo(() => {
    const realVariants = (product.product_variants ?? []).filter(
      (v) => !v.default_variant,
    );
    const filledInfo = (product.info_sections ?? []).some(
      (s) => s.id !== "description" || s.content.trim().length > 0,
    );
    return (
      realVariants.length > 0 ||
      filledInfo ||
      (product.combos ?? []).length > 0 ||
      (product.caracteristicas ?? []).length > 0
    );
  }, [product]);

  const [mode, setMode] = useState(hasAdvancedData ? "detallado" : "rapido");
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedData);

  // ── Helpers de actualización ──────────────────────────────────────────────
  const update = (field, value) =>
    onProductChange((prev) => ({ ...prev, [field]: value }));

  const updateDefaultVariant = (patch) =>
    onProductChange((prev) => ({
      ...prev,
      product_variants: (prev.product_variants ?? []).map((v) =>
        v.default_variant ? { ...v, ...patch } : v,
      ),
    }));

  // ── Datos derivados ───────────────────────────────────────────────────────
  const defaultVariant =
    (product.product_variants ?? []).find((v) => v.default_variant) ??
    (product.product_variants ?? [])[0];

  const realVariants = (product.product_variants ?? []).filter(
    (v) => !v.default_variant,
  );
  const filledInfoSections = (product.info_sections ?? []).filter(
    (s) => s.content.trim().length > 0,
  );

  // ── Validación mínima ─────────────────────────────────────────────────────
  const missing = [];
  if (!product.title?.trim()) missing.push("nombre");
  if (!product.caja) missing.push("categoría");
  const priceTotal =
    product.product_variants?.reduce((acc, v) => acc + (v.price ?? 0), 0) ?? 0;
  if (!priceTotal) missing.push("precio");
  const canSave = missing.length === 0;

  const advancedVisible = mode === "detallado" || showAdvanced;

  // ── Imagen principal (primera variante default) ───────────────────────────
  const defaultVariantBlob = defaultVariant
    ? (variantImageBlobs.get(defaultVariant.id) ?? null)
    : null;

  const handleMainImageSelect = (file) => {
    if (!defaultVariant) return;
    if (!file) {
      setVariantImageBlobs((m) => {
        const next = new Map(m);
        next.delete(defaultVariant.id);
        return next;
      });
      updateDefaultVariant({ image: null });
    } else {
      setVariantImageBlobs((m) => {
        const next = new Map(m);
        next.set(defaultVariant.id, file);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4 pb-2">
      {/* Header con toggle de modo */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            {!product.productId || product.productId === "new"
              ? "Nuevo producto"
              : "Editar producto"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {mode === "rapido"
              ? "Completá lo esencial y publicá. Después podés agregar más detalles."
              : "Configurá todos los detalles del producto."}
          </p>
        </div>
        <ModeToggle
          mode={mode}
          onChange={(m) => {
            setMode(m);
            if (m === "detallado") setShowAdvanced(true);
          }}
        />
      </header>

      {/* Banner de cambios sin guardar */}
      {hasChanges && (
        <div
          role="status"
          className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
        >
          <AlertCircle size={13} className="shrink-0" />
          Tenés cambios sin guardar. Recordá guardar antes de salir.
        </div>
      )}

      {/* TARJETA ESENCIAL — siempre visible */}
      <QuickEssentials
        product={product}
        currencies={currencies}
        categories={categories}
        imageBlob={defaultVariantBlob}
        stock={defaultVariant?.stock || 1}
        priceCompra={defaultVariant?.priceCompra ?? 0}
        embalaje={defaultVariant?.embalaje ?? 0}
        onTitleChange={(v) => update("title", v)}
        onCategoryChange={(v) => update("caja", v)}
        onCurrencyChange={(v) => update("default_moneda", v)}
        onPriceCompraChange={(v) => updateDefaultVariant({ priceCompra: v })}
        onEmbajajeChange={(v) => updateDefaultVariant({ embalaje: v })}
        onStockChange={(v) => updateDefaultVariant({ stock: v })}
        onPriceChange={(v) => {
          const currentPrice = Number(defaultVariant?.price) || 0;
          const newPrice = Number(v) || 0;
          const patch = { price: newPrice };
          // Solo capturar old_price cuando el precio baja
          if (newPrice < currentPrice && currentPrice > 0) {
            patch.old_price = currentPrice;
          }
          updateDefaultVariant(patch);
        }}
        onOldPriceChange={(v) => updateDefaultVariant({ old_price: v })}
        onImageSelect={handleMainImageSelect}
        onCreateCategory={onCreateCategory}
      />

      {/* ── Secciones de información ── */}
      <SectionCard
        title="Secciones de información"
        description="Descripción, ingredientes, modo de uso, advertencias..."
        icon={BookOpen}
        defaultOpen={true}
        summary={
          filledInfoSections.length > 0
            ? `${filledInfoSections.length} ${filledInfoSections.length === 1 ? "sección completada" : "secciones completadas"}`
            : "Sin contenido · agregá descripción"
        }
        badge={
          filledInfoSections.length > 0
            ? `${filledInfoSections.length}`
            : undefined
        }
      >
        <InfoSectionsEditor
          sections={product.info_sections ?? []}
          onChange={(sections) => update("info_sections", sections)}
        />
      </SectionCard>

      {/* SECCIÓN AVANZADA */}
      {!advancedVisible ? (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="w-full group flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-border bg-card hover:border-primary/40 hover:bg-accent/20 transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Layers size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Agregar más detalles
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Variantes · descripción · combos · etiquetas · visibilidad
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:block">
            Opcional
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Más detalles
            </h2>
            {mode === "rapido" && (
              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Ocultar
              </button>
            )}
          </div>

          {/* ── Variantes — solo modo detallado ── */}
          {mode === "detallado" && (
            <SectionCard
              title="Foto, precio y variantes"
              description="Imagen, precio, stock y opciones del producto (colores, tallas, etc.)"
              icon={Layers}
              defaultOpen={realVariants.length > 0 || mode === "detallado"}
              summary={
                realVariants.length > 0
                  ? `${realVariants.length} ${realVariants.length === 1 ? "variante" : "variantes"} configurada${realVariants.length === 1 ? "" : "s"}`
                  : "Sin variantes · usa precio único"
              }
              badge={
                realVariants.length > 0 ? `${realVariants.length}` : undefined
              }
            >
              <VariantsManager
                variants={product.product_variants ?? []}
                onChange={(variants) => update("product_variants", variants)}
                variantImageBlobs={variantImageBlobs}
                setVariantImageBlobs={setVariantImageBlobs}
              />
            </SectionCard>
          )}

          {/* ── Combos sugeridos ── */}
          <SectionCard
            title="Combos sugeridos"
            description="Productos que aparecerán como 'Queda bien con...'"
            icon={Sparkles}
            defaultOpen={(product.combos ?? []).length > 0}
            summary={
              (product.combos ?? []).length > 0
                ? `${product.combos.length}/4 productos sugeridos`
                : "Sin combos sugeridos"
            }
            badge={
              (product.combos ?? []).length > 0
                ? `${product.combos.length}`
                : undefined
            }
          >
            <CombosSection
              selected={product.combos ?? []}
              currentProductId={product.productId ?? ""}
              allProducts={peers}
              onChange={(combos) => update("combos", combos)}
            />
          </SectionCard>

          {/* ── Etiquetas ── */}
          <SectionCard
            title="Etiquetas"
            description="Ayudan a filtrar y buscar tus productos"
            icon={TagIcon}
            defaultOpen={(product.caracteristicas ?? []).length > 0}
            summary={
              (product.caracteristicas ?? []).length > 0
                ? product.caracteristicas.slice(0, 3).join(", ") +
                  (product.caracteristicas.length > 3
                    ? `, +${product.caracteristicas.length - 3}`
                    : "")
                : "Sin etiquetas"
            }
            badge={
              (product.caracteristicas ?? []).length > 0
                ? `${product.caracteristicas.length}`
                : undefined
            }
          >
            <TagsSection
              tags={product.caracteristicas ?? []}
              onChange={(tags) => update("caracteristicas", tags)}
            />
          </SectionCard>

          {/* ── Visibilidad ── */}
          <SectionCard
            title="Visibilidad y opciones"
            description="Cómo se muestra el producto en la tienda"
            icon={Eye}
            defaultOpen={mode === "detallado"}
            summary={
              <span className="flex items-center gap-1.5">
                <span
                  className={
                    product.visible
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {product.visible ? "Visible" : "Oculto"}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span
                  className={
                    product.venta
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {product.venta ? "A la venta" : "No comprable"}
                </span>
                {product.span && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-foreground font-medium">
                      Destacado
                    </span>
                  </>
                )}
              </span>
            }
          >
            <VisibilitySection
              visible={product.visible}
              venta={product.venta}
              span={product.span}
              onChange={(patch) =>
                onProductChange((prev) => ({ ...prev, ...patch }))
              }
            />
          </SectionCard>
        </div>
      )}

      {/* SaveBar sticky */}
      <SaveBar
        hasChanges={hasChanges}
        saving={saving}
        canSave={canSave}
        missingFields={missing}
        onSave={onSave}
      />
    </div>
  );
}

export default ProductEditForm;

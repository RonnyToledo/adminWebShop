// utils/variants.js
// ─── Helpers para leer precio/stock del modelo normalizado de variantes ────────
//
// La DB devuelve product_variants[] en cada producto.
// Si un producto tiene solo 1 variante con es_default:true → producto simple.
// Si tiene varias variantes sin es_default → multi-variante.
// En ambos casos, price/stock del nivel producto son "mirrors" para compat.
// Estos helpers leen siempre desde las variantes para ser correctos.

/**
 * Variante por defecto del producto (es_default: true).
 * Fallback al primer variant si no hay ninguno marcado.
 */
export function getDefaultVariant(product) {
  const variants = product?.product_variants ?? [];
  return variants.find((v) => v.attributes?.es_default) ?? variants[0] ?? null;
}

/**
 * Variantes "reales" (no la default).
 * Si está vacío → producto simple.
 */
export function getRealVariants(product) {
  return (product?.product_variants ?? []).filter(
    (v) => !v.attributes?.es_default,
  );
}

/**
 * ¿El producto tiene múltiples variantes reales?
 */
export function isMultiVariant(product) {
  return getRealVariants(product).length > 0;
}

/**
 * Precio de display: si es multi-variante, devuelve el rango "desde X".
 * Si es simple, devuelve el precio de la variante default (o product.price como fallback).
 */
export function getDisplayPrice(product) {
  if (isMultiVariant(product)) {
    const prices = getRealVariants(product).map((v) => Number(v.price ?? 0));
    const min = Math.min(...prices);
    // Si todos son 0 (producto sin precio configurado), bajar al default
    if (prices.every((p) => p === 0)) {
      const def = getDefaultVariant(product);
      return Number(def?.price ?? product?.price ?? 0);
    }
    return min;
  }
  const def = getDefaultVariant(product);
  return Number(def?.price ?? product?.price ?? 0);
}

/**
 * Precio máximo (útil para mostrar rango en multi-variante).
 */
export function getMaxPrice(product) {
  if (isMultiVariant(product)) {
    const prices = getRealVariants(product).map((v) => Number(v.price ?? 0));
    return Math.max(...prices);
  }
  const def = getDefaultVariant(product);
  return Number(def?.price ?? product?.price ?? 0);
}

/**
 * Stock total del producto sumando todas las variantes activas.
 */
// DESPUÉS (fix):
export function getTotalStock(product) {
  const variants = product?.product_variants ?? [];
  if (variants.length === 0) return Number(product?.stock ?? 0);
  // Sumar TODAS las variantes incluyendo la default
  return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

/**
 * ¿El producto tiene stock disponible?
 */
export function hasStock(product) {
  return getTotalStock(product) > 0;
}

/**
 * Precio para cálculos de ingresos (usa precio mínimo de variantes o precio default).
 * Para pedidos usa siempre el precio real del evento.
 */
export function getPriceForRevenue(product) {
  return getDisplayPrice(product);
}

/**
 * Etiqueta de precio para mostrar en UI.
 * "150 CUP" para simple, "desde 100 CUP" para multi.
 */
export function getPriceLabel(product, monedaNombre = "") {
  const min = getDisplayPrice(product);
  const max = getMaxPrice(product);
  const currency = monedaNombre ? ` ${monedaNombre}` : "";

  if (isMultiVariant(product) && min !== max) {
    return `desde ${min.toLocaleString()}${currency}`;
  }
  return `${min.toLocaleString()}${currency}`;
}

/**
 * Resumen de variantes para mostrar en listas.
 * Ej: "3 variantes · 25 unidades"
 */
export function getVariantSummary(product) {
  const real = getRealVariants(product);
  if (real.length === 0) return null;
  // console.log(real);  ← ELIMINAR
  const totalStock = real.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  return `${real.length} variante${real.length !== 1 ? "s" : ""} · ${totalStock} unidades`;
}

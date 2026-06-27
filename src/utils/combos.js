// utils/combos.js

/**
 * Devuelve los productos sugeridos para un producto dado.
 * Busca en la lista de products del webshop por los IDs del combo.
 */
export function getCombosForProduct(productId, combos = [], allProducts = []) {
  const relatedIds = combos
    .filter((c) => c.product_id === productId || c.related_id === productId)
    .map((c) => (c.product_id === productId ? c.related_id : c.product_id));

  return allProducts.filter((p) => relatedIds.includes(p.productId));
}

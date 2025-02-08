export function ExtraerCategorias(categoria, products) {
  const productCategories = new Set(products.map((product) => product.caja));
  return categoria.filter((category) => productCategories.has(category.id));
}

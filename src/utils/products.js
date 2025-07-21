export function OrderProducts(productos, categorias) {
  const productosOrdenados = {};
  categorias.forEach((categoria) => (productosOrdenados[categoria] = []));

  productos
    .sort((a, b) => a.order - b.order)
    .forEach((producto) => {
      if (productosOrdenados[producto.caja]) {
        productosOrdenados[producto.caja].push(producto);
      }
    });

  const sin_category = productos.filter(
    (prod) => !categorias.includes(prod.caja)
  );

  return [...asignarOrden(productosOrdenados), ...sin_category];
}

function asignarOrden(productos) {
  return Object.keys(productos).flatMap((categoria) =>
    productos[categoria].map((prod, index) => ({
      ...prod,
      order: index,
    }))
  );
}

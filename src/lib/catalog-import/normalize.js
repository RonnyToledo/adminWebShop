// lib/catalog-import/normalize.js

/**
 * Normaliza texto para comparaciones (quita acentos, espacios, mayúsculas).
 */
export const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

export const isRemoteImageUrl = (value) => {
  try {
    const url = new URL(String(value ?? "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const HEADER_ALIASES = {
  title: ["nombre", "producto", "articulo", "title", "name", "item"],
  price: ["precio", "price", "pvp", "precioventa", "valor", "preciodeventa"],
  stock: ["stock", "existencia", "existencias", "cantidad", "inventario"],
  description: ["descripcion", "description", "detalle", "detalles"],
  image: [
    "imagen",
    "image",
    "foto",
    "archivoimagen",
    "nombreimagen",
    "imagenurl",
    "imageurl",
    "urlimagen",
  ],
  // Solo como pista visual para categoría — jamás se usan para resolver el UUID
  categoryHint: ["categoria", "category", "grupo", "familia", "seccion"],
  // Para moneda SÍ se intenta matching real (ver matchEntityByHint más abajo)
  currencyHint: ["moneda", "currency", "divisa"],
};

export function detectColumnMapping(headers) {
  const mapping = {};
  for (const header of headers) {
    const norm = normalizeText(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (!mapping[field] && aliases.some((a) => normalizeText(a) === norm)) {
        mapping[field] = header;
      }
    }
  }
  return mapping;
}

export function getMappedValue(row, mapping, field) {
  const col = mapping[field];
  if (!col) return null;
  return row[col];
}

/**
 * Parsea números soportando múltiples formatos regionales:
 *  "850"        -> 850
 *  "950,00"     -> 950       (coma como decimal)
 *  "750.50"     -> 750.5     (punto como decimal)
 *  "1.250,75"   -> 1250.75   (punto de miles + coma decimal)
 *  "1,250.75"   -> 1250.75   (coma de miles + punto decimal)
 */
export function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  let str = String(value)
    .trim()
    .replace(/[^\d.,-]/g, "");
  if (str === "") return null;

  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Ambos presentes: el que aparece MÁS A LA DERECHA es el separador decimal
    if (lastComma > lastDot) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Solo comas: si hay más de una, son miles y la última es decimal
    const parts = str.split(",");
    str =
      parts.length > 2
        ? parts.slice(0, -1).join("") + "." + parts.at(-1)
        : str.replace(",", ".");
  }
  // Si solo hay punto(s), se asume formato estándar y no se toca

  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

/**
 * Valida una fila ya construida. Se usa tanto al leer el archivo como cada
 * vez que el usuario edita precio/nombre en el preview, para que los errores
 * nunca queden "congelados" tras una corrección manual (ese era el bug: el
 * precio se corregía pero errors nunca se recalculaba).
 */
export function validateImportRow(row) {
  const errors = [];
  if (!row.title?.trim()) errors.push("Falta el nombre del producto.");

  const priceNum = Number(row.price);
  if (
    row.price === null ||
    row.price === undefined ||
    row.price === "" ||
    !Number.isFinite(priceNum) ||
    priceNum < 0
  ) {
    errors.push("Precio inválido.");
  }
  return errors;
}

/**
 * Construye una fila normalizada a partir de una fila cruda del Excel/CSV.
 * categoryId siempre queda en null (selección manual obligatoria).
 * currencyId se resuelve después, en el componente, con matchEntityByHint.
 */
export function buildImportRow(raw, mapping, rowIndex) {
  const title = String(getMappedValue(raw, mapping, "title") ?? "").trim();
  const price = parseNumber(getMappedValue(raw, mapping, "price"));
  const stock = parseNumber(getMappedValue(raw, mapping, "stock"));
  const description = String(
    getMappedValue(raw, mapping, "description") ?? "",
  ).trim();
  const imageName = String(getMappedValue(raw, mapping, "image") ?? "").trim();
  const categoryHint = String(
    getMappedValue(raw, mapping, "categoryHint") ?? "",
  ).trim();
  const currencyHint = String(
    getMappedValue(raw, mapping, "currencyHint") ?? "",
  ).trim();

  const base = {
    __row: rowIndex + 2,
    __selected: true,

    title,
    price,
    stock: stock ?? 1,
    description,
    imageName,

    categoryHint,
    currencyHint,

    categoryId: null, // siempre manual
    currencyId: null, // se resuelve en el componente (match o default)

    imageFile: null,
    imageUrl: isRemoteImageUrl(imageName) ? imageName : null,

    raw,
  };

  return { ...base, errors: validateImportRow(base) };
}

/**
 * Busca en `list` un elemento cuyo nombre/código coincida (normalizado) con
 * `hint`. Devuelve el elemento o null. Pensado para moneda, NO para
 * categoría (esa relación se deja siempre manual por decisión del negocio).
 */
export function matchEntityByHint(
  hint,
  list,
  fields = ["nombre", "codigo", "name"],
) {
  if (!hint) return null;
  const normHint = normalizeText(hint);
  if (!normHint) return null;

  return (
    (list ?? []).find((item) =>
      fields.some((f) => item?.[f] && normalizeText(item[f]) === normHint),
    ) ?? null
  );
}

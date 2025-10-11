// Serializa un objeto de forma estable (keys ordenadas) para comparar
function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
      .join(",") +
    "}"
  );
}

/**
 * Devuelve los diffs entre oldArr y newArr
 * @param {Array} oldArr - array original (p.ej. desde DB)
 * @param {Array} newArr - array modificado (p.ej. cliente)
 * @param {String} key - clave única, por defecto 'id'
 * @returns {Object} { added, removed, updated, unchanged, noId }
 */
export function diffArrays(oldArr, newArr, key = "id") {
  oldArr = Array.isArray(oldArr) ? oldArr : [];
  newArr = Array.isArray(newArr) ? newArr : [];

  const oldMap = new Map();
  for (const item of oldArr) {
    if (item && item[key] != null) oldMap.set(String(item[key]), item);
  }

  const newMap = new Map();
  for (const item of newArr) {
    if (item && item[key] != null) newMap.set(String(item[key]), item);
  }

  const added = []; // items con id que NO existían antes (posible nuevo)
  const updated = []; // items con id que existían pero cambiaron
  const unchanged = []; // items con id que existen y no cambiaron
  const noId = []; // items del newArr que NO tienen id (nuevos locales)
  const removed = []; // items del oldArr cuyo id ya no está en newArr

  // procesar newArr
  for (const item of newArr) {
    const id = item && item[key] != null ? String(item[key]) : null;
    if (id === null) {
      noId.push(item);
      continue;
    }
    if (!oldMap.has(id)) {
      added.push(item);
      continue;
    }
    // existe en ambos -> comparar
    const oldItem = oldMap.get(id);
    if (stableStringify(oldItem) === stableStringify(item))
      unchanged.push(item);
    else updated.push({ before: oldItem, after: item });
  }

  // elementos removidos: los ids del oldMap que no están en newMap
  for (const [id, oldItem] of oldMap.entries()) {
    if (!newMap.has(id)) removed.push(oldItem);
  }

  return { added, removed, updated, unchanged, noId };
}

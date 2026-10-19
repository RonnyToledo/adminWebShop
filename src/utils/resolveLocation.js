// utils/resolveLocation.js
const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const canonicalize = (value) => {
  const raw = normalize(value).replace(/[^a-z0-9]/g, "");
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return String(Number(raw));
  return raw;
};

/**
 * Busca un item en `list` probando primero como código, luego como nombre.
 * Sirve tanto si el valor guardado es un isoCode ("06") como si es
 * un nombre legible ("Cuba", "Cienfuegos").
 */
export function resolveByCodeOrName(list, val, { getCode, getName }) {
  if (!val || !Array.isArray(list) || list.length === 0) return null;
  const target = canonicalize(val);

  return (
    list.find((item) => canonicalize(getCode(item)) === target) ||
    list.find((item) => canonicalize(getName(item)) === target) ||
    null
  );
}

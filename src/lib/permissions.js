// lib/permissions.js  ← archivo nuevo
export const STORE_PERMISSIONS = {
  owner: [
    "read",
    "write",
    "delete",
    "settings",
    "members",
    "billing",
    "analytics",
  ],
  admin: ["read", "write", "delete", "settings", "members", "analytics"],
  editor: ["read", "write"],
  analyst: ["read", "analytics"],
  support: ["read", "write:orders"],
};

export const NAV_PERMISSIONS = {
  // group name → acción mínima requerida
  "": "read", // sin grupo (home)
  Catálogo: "write",
  Pedidos: "read",
  Marketing: "write",
  Analíticas: "analytics",
  Configuración: "settings",
  Equipo: "members",
};

/**
 * @param {string} storeRole
 * @param {string} action
 */
export function can(storeRole, action) {
  if (!storeRole) return false;
  return (STORE_PERMISSIONS[storeRole] ?? []).includes(action);
}

/**
 * Dado un array de acciones, devuelve true si el rol tiene TODAS.
 */
export function canAll(storeRole, actions) {
  return actions.every((a) => can(storeRole, a));
}

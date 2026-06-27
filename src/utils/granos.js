// utils/granos.js

export const NIVELES = [
  {
    nombre: "Gold",
    min: 5000,
    mult: 2.0,
    color: "#EF9F27",
    bg: "#FAEEDA",
    text: "#412402",
  },
  {
    nombre: "Silver",
    min: 2000,
    mult: 1.5,
    color: "#888780",
    bg: "#D3D1C7",
    text: "#2C2C2A",
  },
  {
    nombre: "Bronze",
    min: 500,
    mult: 1.2,
    color: "#BA7517",
    bg: "#FAC775",
    text: "#412402",
  },
  {
    nombre: "Semilla",
    min: 0,
    mult: 1.0,
    color: "#B4B2A9",
    bg: "#F1EFE8",
    text: "#444441",
  },
];

export function getNivel(granos) {
  return NIVELES.find((n) => granos >= n.min) ?? NIVELES[NIVELES.length - 1];
}

export function getNivelSiguiente(granos) {
  const idx = NIVELES.findIndex((n) => granos >= n.min);
  return idx > 0 ? NIVELES[idx - 1] : null;
}

export function calcularGranosClientes(events) {
  const mapa = {};

  events
    .filter((e) => e.events === "compra")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach((e) => {
      const tel = String(e.phonenumber || "").trim();
      if (!tel) return;

      if (!mapa[tel]) {
        mapa[tel] = {
          telefono: tel,
          nombre: e.nombre || "—",
          compras: 0,
          totalGastado: 0,
          granos: 0,
        };
      }

      // nombre: siempre el más reciente
      if (e.nombre) mapa[tel].nombre = e.nombre;

      const totalPedido = e.desc?.total ?? 0;
      const granosBase = Math.max(1, Math.floor(totalPedido / 10));
      const nivelActual = getNivel(mapa[tel].granos);
      const granosGanados = Math.round(granosBase * nivelActual.mult);

      // bonus por código promo
      const codigoUsado = e.desc?.code?.name;
      const bonus = codigoUsado ? 10 : 0;

      mapa[tel].compras += 1;
      mapa[tel].totalGastado += totalPedido;
      mapa[tel].granos += granosGanados + bonus;
    });

  return Object.values(mapa).map((c) => ({
    ...c,
    nivel: getNivel(c.granos),
    siguiente: getNivelSiguiente(c.granos),
  }));
}

export function progresoHaciaNextNivel(granos) {
  const actual = getNivel(granos);
  const siguiente = getNivelSiguiente(granos);
  if (!siguiente) return 100;
  const tramo = siguiente.min - actual.min;
  const avance = granos - actual.min;
  return Math.min(100, Math.round((avance / tramo) * 100));
}

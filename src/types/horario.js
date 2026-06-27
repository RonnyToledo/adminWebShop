/**
 * horario.js  →  @/types/horario
 *
 * Schema DB (tabla `horarios`) — tras la migración:
 *   { id, sitio_id, dia: 0-6, turno: 0-N, open: boolean,
 *     apertura: "HH:MM:SS", cierre: "HH:MM:SS" }
 *
 * Convención de días: 0 = Domingo … 6 = Sábado (igual que Date.getDay())
 *
 * Modelo UI por día:
 *   { dia: number, nombre: string, turnos: TurnoUI[] }
 *
 * Modelo UI por turno (TurnoUI):
 *   { id: number|null, turno: number, es_24h: boolean,
 *     apertura: "HH:MM:SS", cierre: "HH:MM:SS" }
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

export const DIA_NOMBRES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const APERTURA_24H = "00:00:00";
export const CIERRE_24H = "23:59:59";
export const APERTURA_DEFAULT = "08:00:00";
export const CIERRE_DEFAULT = "20:00:00";

// ─── Helpers de formato ───────────────────────────────────────────────────────

/** "HH:MM:SS" → "HH:MM" */
export function formatHora(hms) {
  if (!hms) return "—";
  return String(hms).slice(0, 5);
}

/** "HH:MM" → "HH:MM:00" para guardar en DB */
export function toDBTime(hm) {
  if (!hm) return "00:00:00";
  if (String(hm).length >= 8) return String(hm).slice(0, 8);
  return `${hm}:00`;
}

// ─── Helpers de validación ────────────────────────────────────────────────────

export function toSeconds(hms) {
  if (!hms) return 0;
  const parts = String(hms).split(":").map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

export const timeToMinutes = (hms) => Math.floor(toSeconds(hms) / 60);

/**
 * Valida los turnos de un día.
 * Devuelve array de strings de error (vacío = sin errores).
 */
export function validarTurnosDia(turnos) {
  const errores = [];
  turnos.forEach((t, i) => {
    if (t.es_24h) return;
    const abre = toSeconds(t.apertura);
    const cierra = toSeconds(t.cierre);
    if (abre >= cierra) {
      errores.push(`Turno ${i + 1}: la apertura debe ser antes del cierre`);
      return;
    }
    for (let j = 0; j < i; j++) {
      if (turnos[j].es_24h) {
        errores.push(`Turno ${i + 1}: solapa con el turno de 24 horas`);
        break;
      }
      if (
        abre < toSeconds(turnos[j].cierre) &&
        cierra > toSeconds(turnos[j].apertura)
      ) {
        errores.push(`Turno ${i + 1}: se solapa con el turno ${j + 1}`);
        break;
      }
    }
  });
  return errores;
}

/** Valida todos los días. Devuelve [{ dia, nombre, mensaje }] */
export function validateHorario(dias) {
  const result = [];
  for (const d of dias) {
    const errores = validarTurnosDia(d.turnos);
    if (errores.length > 0) {
      result.push({ dia: d.dia, nombre: d.nombre, mensaje: errores[0] });
    }
  }
  return result;
}

// ─── DB → UI ──────────────────────────────────────────────────────────────────

/**
 * Convierte HorarioRow[] de la DB en el array UI de 7 días con turnos.
 * Compatibilidad hacia atrás: si las filas no tienen columna `turno`,
 * se asume turno = 0 y el sistema sigue funcionando.
 */
export function buildUIFromRows(rows) {
  const byDia = {};
  for (const r of rows ?? []) {
    const d = Number(r.dia);
    if (!byDia[d]) byDia[d] = [];
    byDia[d].push(r);
  }

  return DIA_NOMBRES.map((nombre, index) => {
    const filas = (byDia[index] ?? [])
      .filter((r) => r.open)
      .sort((a, b) => (a.turno ?? 0) - (b.turno ?? 0));

    const turnos = filas.map((r, i) => ({
      id: r.id ?? null,
      turno: r.turno ?? i,
      es_24h: r.apertura === APERTURA_24H && r.cierre === CIERRE_24H,
      apertura: r.apertura ?? APERTURA_DEFAULT,
      cierre: r.cierre ?? CIERRE_DEFAULT,
    }));

    return { dia: index, nombre, turnos };
  });
}

export const buildHorarioCompleto = buildUIFromRows;
export const buildEditorFromRows = buildUIFromRows;

// ─── UI → DB ──────────────────────────────────────────────────────────────────

/**
 * Convierte el array UI de 7 días en HorarioRow[] para upsert.
 * Un día sin turnos genera una fila con open=false, turno=0
 * (para poder "cerrar" días que antes tenían turnos).
 */
export function uiArrayToDB(dias, sitio_id) {
  const rows = [];
  for (const dia of dias) {
    if (dia.turnos.length === 0) {
      rows.push({
        sitio_id,
        dia: dia.dia,
        turno: 0,
        open: false,
        apertura: toDBTime(APERTURA_DEFAULT),
        cierre: toDBTime(CIERRE_DEFAULT),
      });
    } else {
      dia.turnos.forEach((t, i) => {
        const row = {
          sitio_id,
          dia: dia.dia,
          turno: i,
          open: true,
          apertura: t.es_24h ? APERTURA_24H : toDBTime(t.apertura),
          cierre: t.es_24h ? CIERRE_24H : toDBTime(t.cierre),
        };
        if (t.id != null) row.id = t.id;
        rows.push(row);
      });
    }
  }
  return rows;
}

/** Alias legacy: acepta una entrada de día y devuelve sus rows */
export function uiToDB(diaEntry, sitio_id) {
  return uiArrayToDB([diaEntry], sitio_id);
}

// ─── Display ──────────────────────────────────────────────────────────────────

export function formatRango(turno) {
  if (turno?.es_24h) return "00:00 – 23:59";
  return `${formatHora(turno?.apertura)} – ${formatHora(turno?.cierre)}`;
}

export const formatTurnoLabel = formatRango;

export function getEstadoAhora(rows) {
  const now = new Date();
  const dowHoy = now.getDay();
  const nowSecs =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const turnosHoy = (rows ?? []).filter(
    (r) => Number(r.dia) === dowHoy && r.open,
  );
  if (turnosHoy.length === 0) return { abierto: false, label: "Cerrado hoy" };
  for (const r of turnosHoy) {
    if (r.apertura === APERTURA_24H && r.cierre === CIERRE_24H)
      return { abierto: true, label: "Abierto 24h" };
    if (nowSecs >= toSeconds(r.apertura) && nowSecs < toSeconds(r.cierre))
      return {
        abierto: true,
        label: `Abierto · cierra ${formatHora(r.cierre)}`,
      };
  }
  const proximo = turnosHoy
    .filter((r) => toSeconds(r.apertura) > nowSecs)
    .sort((a, b) => toSeconds(a.apertura) - toSeconds(b.apertura))[0];
  return {
    abierto: false,
    label: proximo
      ? `Cerrado · abre ${formatHora(proximo.apertura)}`
      : "Cerrado hoy",
  };
}

export const applyMode = (entry, mode) => {
  switch (mode) {
    case "closed":
      return { ...entry, open: false };
    case "allday":
      return {
        ...entry,
        open: true,
        apertura: APERTURA_24H,
        cierre: CIERRE_24H,
      };
    case "custom":
      return {
        ...entry,
        open: true,
        apertura: APERTURA_DEFAULT,
        cierre: CIERRE_DEFAULT,
      };
    default:
      return entry;
  }
};

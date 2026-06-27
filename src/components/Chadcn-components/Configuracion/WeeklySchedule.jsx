"use client";
/**
 * WeeklySchedule.jsx
 *
 * Horario semanal con soporte de múltiples turnos por día.
 * Compatible con el schema DB tras la migración:
 *   horarios { id, sitio_id, dia, turno, open, apertura, cierre }
 *
 * Props:
 *   horario         → HorarioRow[]  (webshop.store.horario)
 *   onHorarioChange → (HorarioRow[]) => void
 */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Sun,
  Moon,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  buildUIFromRows,
  uiArrayToDB,
  validarTurnosDia,
  validateHorario,
  toDBTime,
  toSeconds,
  formatRango,
  APERTURA_24H,
  CIERRE_24H,
  APERTURA_DEFAULT,
  CIERRE_DEFAULT,
} from "@/types/horario";

// ─── Helpers locales ──────────────────────────────────────────────────────────

function turnoNuevo() {
  return {
    id: null,
    turno: null,
    es_24h: false,
    apertura: APERTURA_DEFAULT,
    cierre: CIERRE_DEFAULT,
  };
}

function recalcCruzaMedianoche(t) {
  if (t.es_24h) return { ...t, cruza: false };
  const cruza = toSeconds(t.cierre) < toSeconds(t.apertura);
  return { ...t, cruza };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function WeeklySchedule({ horario, onHorarioChange }) {
  const [dias, setDias] = useState(() => buildUIFromRows(horario ?? []));
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    setDias(buildUIFromRows(horario ?? []));
  }, [horario]);

  const errores = useMemo(() => validateHorario(dias), [dias]);

  // Cada vez que cambian los días emitimos HorarioRow[] al padre
  const commit = useCallback(
    (newDias) => {
      setDias(newDias);
      // Necesitamos el sitio_id del primer row original para preservarlo
      // pero onHorarioChange recibe el array y el padre lo manda al PUT
      // donde syncHorariosForStore ya agrega el sitio_id.
      // Por eso emitimos el formato "UI plano" que el servidor espera:
      onHorarioChange(uiArrayToDB(newDias, undefined));
    },
    [onHorarioChange],
  );

  function updateDia(diaIndex, fn) {
    const newDias = dias.map((d) => (d.dia === diaIndex ? fn(d) : d));
    commit(newDias);
  }

  // ── Acciones ────────────────────────────────────────────────────────────────

  function addTurno(diaIndex) {
    updateDia(diaIndex, (d) => {
      if (d.turnos.some((t) => t.es_24h)) return d; // no agregar si hay 24h
      return { ...d, turnos: [...d.turnos, turnoNuevo()] };
    });
    setExpandido(diaIndex);
  }

  function set24h(diaIndex) {
    updateDia(diaIndex, (d) => ({
      ...d,
      turnos: [
        {
          id: d.turnos[0]?.id ?? null,
          turno: 0,
          es_24h: true,
          apertura: APERTURA_24H,
          cierre: CIERRE_24H,
        },
      ],
    }));
  }

  function clearDia(diaIndex) {
    updateDia(diaIndex, (d) => ({ ...d, turnos: [] }));
  }

  function patchTurno(diaIndex, turnoIdx, patch) {
    updateDia(diaIndex, (d) => ({
      ...d,
      turnos: d.turnos.map((t, i) =>
        i === turnoIdx ? recalcCruzaMedianoche({ ...t, ...patch }) : t,
      ),
    }));
  }

  function removeTurno(diaIndex, turnoIdx) {
    updateDia(diaIndex, (d) => ({
      ...d,
      turnos: d.turnos.filter((_, i) => i !== turnoIdx),
    }));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-1.5">
      {/* Banner global de errores */}
      {errores.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 space-y-1 mb-2">
          {errores.map((e, i) => (
            <p
              key={i}
              className="flex items-start gap-2 text-xs text-destructive"
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>{e.nombre}:</strong> {e.mensaje}
              </span>
            </p>
          ))}
        </div>
      )}

      {dias.map((dia) => {
        const isOpen = expandido === dia.dia;
        const hayTurnos = dia.turnos.length > 0;
        const tiene24h = dia.turnos.some((t) => t.es_24h);
        const hayError = errores.some((e) => e.dia === dia.dia);
        const erroresDia = validarTurnosDia(dia.turnos);

        return (
          <div
            key={dia.dia}
            className={cn(
              "rounded-xl border transition-all",
              hayError
                ? "border-destructive/50 bg-destructive/5"
                : hayTurnos
                  ? "border-border bg-card"
                  : "border-border/40 bg-muted/20",
            )}
          >
            {/* ── Cabecera del día ── */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
              onClick={() => setExpandido(isOpen ? null : dia.dia)}
            >
              {/* Dot de estado */}
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                  hayTurnos
                    ? tiene24h
                      ? "bg-amber-400"
                      : "bg-blue-400"
                    : "bg-muted-foreground/25",
                )}
              />

              {/* Nombre del día */}
              <span className="text-sm font-medium w-20 shrink-0 text-foreground">
                {dia.nombre}
              </span>

              {/* Badges de turnos */}
              <div className="flex-1 flex flex-wrap gap-1 overflow-hidden min-w-0">
                {hayTurnos ? (
                  dia.turnos.map((t, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={cn(
                        "text-[10px] font-normal py-0 h-5 gap-0.5",
                        t.es_24h && "border-amber-400 text-amber-600",
                        t.cruza && "border-amber-400 text-amber-600",
                        erroresDia[i] && "border-destructive text-destructive",
                      )}
                    >
                      {t.es_24h && <Sun className="w-2.5 h-2.5" />}
                      {t.cruza && <Moon className="w-2.5 h-2.5" />}
                      {formatRango(t)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Cerrado</span>
                )}
              </div>

              {/* Acciones inline — stopPropagation para no abrir/cerrar el panel */}
              <div
                className="flex items-center gap-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {!tiene24h && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Agregar turno"
                    onClick={() => addTurno(dia.dia)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
                {hayTurnos && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Quitar todos los turnos (cerrar día)"
                    onClick={() => clearDia(dia.dia)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground transition-transform ml-0.5",
                    isOpen && "rotate-180",
                  )}
                />
              </div>
            </div>

            {/* ── Panel expandido ── */}
            {isOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-2.5">
                {/* Acceso rápido 24h */}
                {!tiene24h && (
                  <button
                    type="button"
                    onClick={() => set24h(dia.dia)}
                    className="text-xs text-amber-600 hover:underline flex items-center gap-1"
                  >
                    <Sun className="w-3 h-3" />
                    Marcar como 24 horas
                  </button>
                )}

                {dia.turnos.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Sin turnos — el negocio estará cerrado este día.
                  </p>
                )}

                {dia.turnos.map((turno, idx) => (
                  <TurnoRow
                    key={idx}
                    turno={turno}
                    error={erroresDia[idx]}
                    onChange={(patch) => patchTurno(dia.dia, idx, patch)}
                    onRemove={() => removeTurno(dia.dia, idx)}
                  />
                ))}

                {!tiene24h && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5 mt-1"
                    onClick={() => addTurno(dia.dia)}
                  >
                    <Plus className="w-3 h-3" />
                    Agregar otro turno
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TurnoRow ─────────────────────────────────────────────────────────────────

function TurnoRow({ turno, error, onChange, onRemove }) {
  if (turno.es_24h) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Abierto 24 horas
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        error
          ? "border-destructive/50 bg-destructive/5"
          : turno.cruza
            ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10"
            : "border-border bg-muted/10",
      )}
    >
      <TimeInput
        value={turno.apertura}
        onChange={(v) => onChange({ apertura: toDBTime(v) })}
        label="Apertura"
        hasError={!!error}
      />
      <span className="text-muted-foreground text-xs shrink-0">→</span>
      <TimeInput
        value={turno.cierre}
        onChange={(v) => onChange({ cierre: toDBTime(v) })}
        label="Cierre"
        hasError={!!error}
      />

      {/* Indicador de cruza medianoche */}
      {turno.cruza && !error && (
        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 shrink-0">
          <Moon className="w-3 h-3" />
          +1d
        </span>
      )}

      {/* Indicador de error */}
      {error && (
        <span className="flex items-center gap-0.5 text-[10px] text-destructive shrink-0">
          <AlertCircle className="w-3 h-3" />
        </span>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

// ─── TimeInput ────────────────────────────────────────────────────────────────

function TimeInput({ value, onChange, label, hasError }) {
  // Convierte "HH:MM:SS" → "HH:MM" para el input, y al cambiar emite "HH:MM"
  const displayValue = value ? String(value).slice(0, 5) : "";

  return (
    <input
      type="time"
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={cn(
        "w-24 rounded-md border bg-background px-2 py-1",
        "text-sm text-foreground focus:outline-none focus:ring-1",
        hasError
          ? "border-destructive focus:ring-destructive"
          : "border-input focus:ring-ring",
        "dark:bg-background",
      )}
    />
  );
}

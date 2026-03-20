import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomTimeInput from "./CustomTimeInput";

export default function DayRow({ dia, horario, onHorarioChange }) {
  function onChange(value) {
    const horarios = {
      "option-one": { dia, cierre: 0, apertura: 0 },
      "option-two": { dia, cierre: 24, apertura: 0 },
      "option-three": { dia, cierre: 23, apertura: 1 },
    };
    if (horarios[value]) {
      onHorarioChange(horarios[value]);
    } else {
      console.warn(`Opción desconocida: ${value}`);
    }
  }

  const current = getHorarioDefault(horario);
  const isOpen = current !== "option-one";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {/* Nombre del día con indicador visual */}
      <div className="flex items-center gap-2 sm:w-28 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isOpen ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />
        <span
          className={`text-sm font-medium ${isOpen ? "text-foreground" : "text-muted-foreground"}`}
        >
          {dia}
        </span>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <Select value={current} onValueChange={onChange}>
          <SelectTrigger className="w-full sm:w-40 text-sm">
            <SelectValue placeholder="Selecciona disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option-one">No laborable</SelectItem>
            <SelectItem value="option-two">24 horas</SelectItem>
            <SelectItem value="option-three">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {horario.apertura !== 0 && (
          <CustomTimeInput
            dia={dia}
            horario={horario}
            onHorarioChange={onHorarioChange}
          />
        )}

        {/* Badge de resumen */}
        {current === "option-two" && (
          <span className="self-center text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 shrink-0">
            Todo el día
          </span>
        )}
        {current === "option-one" && (
          <span className="self-center text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 shrink-0">
            Cerrado
          </span>
        )}
      </div>
    </div>
  );
}

const getHorarioDefault = ({ apertura, cierre }) =>
  cierre === 0 && apertura === 0
    ? "option-one"
    : cierre === 24
      ? "option-two"
      : "option-three";

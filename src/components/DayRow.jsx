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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <div className="font-medium text-lg sm:w-24">{dia}</div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <Select
          value={getHorarioDefault(horario)}
          onValueChange={(value) => onChange(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
      </div>
    </div>
  );
}

// Utilidades
const getHorarioDefault = ({ apertura, cierre }) =>
  cierre === 0 && apertura === 0
    ? "option-one"
    : cierre === 24
    ? "option-two"
    : "option-three";

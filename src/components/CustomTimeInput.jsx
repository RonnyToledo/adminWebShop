import React from "react";
import { Input } from "@/components/ui/input";

export default function CustomTimeInput({ dia, horario, onHorarioChange }) {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      <TimeInput
        label="Opening Time"
        value={formatTime(horario.apertura)}
        onChange={(time) =>
          onHorarioChange({ dia, cierre: horario.cierre, apertura: time })
        }
      />
      <span className="hidden sm:inline">-</span>

      <TimeInput
        label="Closing Time"
        value={formatTime(horario.cierre)}
        onChange={(time) =>
          onHorarioChange({ dia, cierre: time, apertura: horario.apertura })
        }
      />
    </div>
  );
}
const TimeInput = ({ label, value, onChange }) => (
  <Input
    type="time"
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value.split(":")[0], 10))}
    className="w-full sm:w-24"
    aria-label={label}
  />
);

const formatTime = (time) => {
  return time >= 10 ? `${time}:00` : `0${time}:00`;
};

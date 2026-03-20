import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import DayRow from "./DayRow";
import { Clock } from "lucide-react";

export default function WeeklyAvailability({ horario, onHorarioChange }) {
  // Días abiertos según los datos del log
  const diasAbiertos = horario.filter(
    (d) => d.apertura !== 0 || d.cierre !== 0,
  ).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Disponibilidad semanal</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {diasAbiertos} de {horario.length} días activos
          </span>
        </div>
        <CardDescription>
          Configura el horario de atención de tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {horario.map((obj, ind) => (
            <div key={ind} className="py-3 first:pt-0 last:pb-0">
              <DayRow
                dia={obj.dia}
                horario={obj}
                onHorarioChange={(updated) => {
                  const newHorario = [...horario];
                  newHorario[ind] = updated;
                  onHorarioChange(newHorario);
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

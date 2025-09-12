import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DayRow from "./DayRow";

export default function WeeklyAvailability({ horario, onHorarioChange }) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl text-center">
          Disponibilidad Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {horario.map((obj, ind) => (
            <DayRow
              key={ind}
              dia={obj.dia}
              horario={obj}
              onHorarioChange={(updated) => {
                const newHorario = [...horario];
                newHorario[ind] = updated;
                onHorarioChange(newHorario);
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

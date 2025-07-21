"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ThemeContext } from "@/context/useContext";
import { useState, useContext, useEffect } from "react";

export default function UsageChart() {
  const { webshop } = useContext(ThemeContext);
  const [countEntriesInLast90Days, setcountEntriesInLast90Days] = useState([]);
  const [totalVisits, settotalVisits] = useState(0);
  const [averageVisits, setaverageVisits] = useState(0);

  useEffect(() => {
    if (webshop.ga?.countEntriesInLast90Days) {
      const data = webshop.ga?.countEntriesInLast90Days;
      setcountEntriesInLast90Days(data);
      settotalVisits(data.reduce((sum, day) => sum + day.count, 0));
      setaverageVisits((totalVisits / data.length).toFixed(2));
    }
  }, [webshop.ga, totalVisits]);

  return (
    <Card className="max-w-xs" x-chunk="charts-01-chunk-1">
      <CardHeader>
        <CardTitle>Uso del Sitio Web</CardTitle>
        <CardDescription>
          Actividad diaria durante los últimos 90 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ChartContainer
            config={{
              value: {
                label: "count",
                color: "hsl(var(--chart-1))",
              },
            }}
          >
            <HeatmapChart data={countEntriesInLast90Days} />
          </ChartContainer>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Total de Visitas
              </h4>
              <p className="text-2xl font-bold">{totalVisits}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Promedio Diario
              </h4>
              <p className="text-2xl font-bold">{averageVisits}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapChart({ data }) {
  const maxValue = Math.max(...data.map((d) => d.count));

  return (
    <div className="grid grid-cols-12 gap-1">
      {data.map((day) => (
        <div key={day.date} className="relative group">
          <div
            className={`w-4 h-4 rounded-sm ${getColor(day.count, maxValue)}`}
            title={`${day.date}: ${day.count} visitas`}
          ></div>
        </div>
      ))}
    </div>
  );
}

function getColor(value, maxValue) {
  const intensity = value / maxValue;
  if (intensity < 0.1) return "bg-orange-100";
  if (intensity < 0.2) return "bg-orange-200";
  if (intensity < 0.3) return "bg-orange-300";
  if (intensity < 0.4) return "bg-orange-400";
  if (intensity < 0.5) return "bg-orange-500";
  if (intensity < 0.6) return "bg-orange-600";
  if (intensity < 0.7) return "bg-orange-700";
  if (intensity < 0.8) return "bg-orange-800";
  if (intensity < 0.9) return "bg-orange-900";
  return "bg-orange-950";
}

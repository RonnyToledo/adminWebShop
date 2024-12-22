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
// Datos proporcionados
const countEntriesInLast90Days = [
  {
    date: "09-18",
    count: 0,
  },
  {
    date: "09-19",
    count: 1,
  },
  {
    date: "09-20",
    count: 0,
  },
  {
    date: "09-21",
    count: 0,
  },
  {
    date: "09-22",
    count: 0,
  },
  {
    date: "09-23",
    count: 3,
  },
];

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
  console.log(averageVisits);

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
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            {day.date}: {day.count} visitas
          </div>
        </div>
      ))}
    </div>
  );
}

function getColor(value, maxValue) {
  const intensity = value / maxValue;
  if (intensity < 0.2) return "bg-orange-100";
  if (intensity < 0.4) return "bg-orange-300";
  if (intensity < 0.6) return "bg-orange-500";
  if (intensity < 0.8) return "bg-orange-700";
  return "bg-orange-900";
}

"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingProgress({ steps, className }) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Configura tu tienda
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount} de {steps.length} pasos completados
          </p>
        </div>
        <span className="text-2xl font-bold text-primary">
          {Math.round(progress)}%
        </span>
      </div>

      <Progress value={progress} className="h-2 mb-4" />

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2">
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                step.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {step.title}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

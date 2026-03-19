"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card
      className={cn(
        "p-5 transition-all duration-300 hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp className="w-3 h-3 text-success" />}
              {isNegative && (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  !isPositive && !isNegative && "text-muted-foreground",
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

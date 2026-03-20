"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureCard({
  title,
  description,
  actionLabel,
  actionHref = "#",
  icon,
  image,
  variant = "default",
  badge,
  completed,
  className,
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:border-primary/40 group",
        variant === "highlight" &&
          "border-primary/30 bg-gradient-to-br from-card to-primary/5",
        variant === "success" && "border-success/30",
        className,
      )}
    >
      {completed && (
        <div className="absolute top-3 right-3 z-10">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
      )}

      <div className="p-5">
        {/* Header with icon or badge */}
        <div className="flex items-start justify-between mb-4">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              {icon}
            </div>
          )}
          {badge && (
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>

        {/* Image */}
        {image && (
          <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-secondary">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* Action */}
        {actionLabel && (
          <Button
            variant="ghost"
            size="sm"
            className="group/btn p-0 h-auto text-primary hover:text-primary hover:bg-transparent"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        )}
      </div>
    </Card>
  );
}

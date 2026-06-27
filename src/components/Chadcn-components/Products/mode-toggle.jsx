"use client";

import { Zap, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModeToggle({ mode, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Modo de edición"
      className="inline-flex items-center p-1 rounded-full bg-secondary border border-border"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "rapido"}
        onClick={() => onChange("rapido")}
        className={cn(
          "flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all",
          mode === "rapido"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Zap size={12} />
        Rápido
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "detallado"}
        onClick={() => onChange("detallado")}
        className={cn(
          "flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all",
          mode === "detallado"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <SlidersHorizontal size={12} />
        Detallado
      </button>
    </div>
  );
}

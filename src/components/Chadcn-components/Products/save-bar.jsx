"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveBar({
  hasChanges,
  saving,
  canSave,
  missingFields,
  onSave,
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/85 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          {saving ? (
            <Loader2
              size={13}
              className="text-muted-foreground animate-spin shrink-0"
            />
          ) : hasChanges ? (
            <Circle
              size={9}
              className="fill-amber-500 text-amber-500 shrink-0"
            />
          ) : (
            <Check size={13} className="text-primary shrink-0" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {saving
              ? "Guardando..."
              : !canSave
                ? `Falta: ${missingFields.join(", ")}`
                : hasChanges
                  ? "Cambios sin guardar"
                  : "Todo guardado"}
          </span>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSave || !hasChanges}
          className={cn(
            "inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold shrink-0 transition-all",
            "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40",
          )}
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check size={14} />
              Guardar producto
            </>
          )}
        </button>
      </div>
    </div>
  );
}

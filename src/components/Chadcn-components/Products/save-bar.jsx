"use client";

import { CalendarClock, Check, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SaveBar({
  hasChanges,
  saving,
  canSave,
  missingFields,
  onSave,
  onSchedule,
  canSchedule = false,
  scheduledAt,
}) {
  const [open, setOpen] = useState(false);
  const [dateValue, setDateValue] = useState("");

  useEffect(() => {
    if (!open) return;
    const date = scheduledAt ? new Date(scheduledAt) : new Date();
    const offset = date.getTimezoneOffset();
    setDateValue(
      new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16),
    );
  }, [open, scheduledAt]);

  const confirmSchedule = () => {
    const selectedDate = new Date(dateValue);
    if (!dateValue || Number.isNaN(selectedDate.getTime())) return;
    if (selectedDate <= new Date()) return;
    setOpen(false);
    onSchedule(selectedDate.toISOString());
  };

  return (
    <>
      <div className="sticky bottom-0 z-30 w-full min-w-0 py-3 bg-background/85 backdrop-blur-md border-t border-border">
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Guardar producto con programación"
              title="Guardar con programación"
              onClick={() => setOpen(true)}
              disabled={saving || !canSchedule}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CalendarClock size={16} />
            </button>
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
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base">
              Programar publicación
            </DialogTitle>
            <DialogDescription className="text-xs">
              El producto se guardará y aparecerá automáticamente en esa fecha.
            </DialogDescription>
          </DialogHeader>
          <label
            htmlFor="schedule-publish-at"
            className="mt-2 block text-xs font-medium text-foreground"
          >
            Fecha y hora
          </label>
          <input
            id="schedule-publish-at"
            type="datetime-local"
            value={dateValue}
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            onChange={(event) => setDateValue(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <DialogFooter className="mt-2 -mx-5 -mb-5 flex-row justify-end rounded-b-2xl border-0 bg-transparent p-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmSchedule}
              disabled={!dateValue || new Date(dateValue) <= new Date()}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Guardar programación
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

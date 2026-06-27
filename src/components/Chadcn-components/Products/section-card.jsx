"use client";

import React from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  icon: Icon,
  summary,
  defaultOpen = false,
  forceOpen,
  badge,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = forceOpen ?? internalOpen;

  return (
    <div className="bg-card border border-border rounded-2xl  transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setInternalOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            open
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground",
          )}
        >
          <Icon size={15} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-[15px] font-semibold text-foreground leading-tight">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {summary ? (
              <span className="text-xs text-muted-foreground truncate">
                {summary}
              </span>
            ) : description ? (
              <span className="text-xs text-muted-foreground truncate">
                {description}
              </span>
            ) : null}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 sm:px-5 py-4 sm:py-5 bg-background/40">
          {children}
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Una sola definición de radio/borde para todas las cards de Configuración.
export const CARD_CLASS = "rounded-2xl border-border shadow-none";

/** Título de sección (agrupa varias cards). */
export function SectionHeading({ title, description, icon: Icon }) {
  return (
    <div className="space-y-1">
      {Icon && (
        <div className="flex items-center justify-start gap-2">
          <Icon className="size-4" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/** Header de card con el ícono en círculo (w-7 h-7 rounded-full bg-secondary). */
export function CardHeading({ icon: Icon, title, description, children }) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
      {description && <CardDescription>{description}</CardDescription>}
      {children}
    </CardHeader>
  );
}

/** Fila de ajuste: texto a la izquierda, control a la derecha, footer opcional. */
export function SettingRow({ label, description, htmlFor, control, footer }) {
  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <Label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {control}
      </div>
      {footer && (
        <div className="border-t border-border/60 px-4 py-3">{footer}</div>
      )}
    </div>
  );
}

// ─── Navegación por secciones (pill negra en la sección activa) ──────────────

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export function SectionNav({ sections }) {
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const active = useActiveSection(ids);

  return (
    <nav
      aria-label="Secciones de configuración"
      className=" sticky top-[56px] z-20 overflow-x-auto max-w-full bg-gradient-to-b from-background to-transparent backdrop-blur-md px-4 py-2  sm:px-6 lg:px-8"
    >
      <ul className="flex w-full md:w-fit justify-evenly gap-1 rounded-full p-1">
        {sections.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={cn(
                "flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors w-full text-center md:w-auto gap-2",
                active === id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

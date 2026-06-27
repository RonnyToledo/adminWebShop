"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Beaker,
  ChevronDown,
  FileText,
  Info,
  Leaf,
  Package,
  Plus,
  Star,
  Trash2,
  Zap,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ICONS = {
  FileText: FileText,
  Beaker: Beaker,
  Zap: Zap,
  Leaf: Leaf,
  Info: Info,
  Star: Star,
  AlertTriangle: AlertTriangle,
  Package: Package,
  Clock: Clock,
};

const PRESETS = [
  { label: "Ingredientes", icon: "Beaker" },
  { label: "Modo de uso", icon: "Zap" },
  { label: "Beneficios", icon: "Leaf" },
  { label: "Información nutricional", icon: "Info" },
  { label: "Recomendaciones", icon: "Star" },
  { label: "Advertencias", icon: "AlertTriangle" },
  { label: "Contenido del paquete", icon: "Package" },
  { label: "Tiempo de preparacion", icon: "Clock" },
];

const DEFAULT_DESCRIPTION = {
  id: "description",
  label: "Descripción",
  icon: "FileText",
  content: "",
  order: 0,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function normalize(sections) {
  const rest = sections.filter((s) => s.id !== "description");
  const desc =
    sections.find((s) => s.id === "description") ?? DEFAULT_DESCRIPTION;
  return [
    { ...desc, order: 0 },
    ...rest.map((s, i) => ({ ...s, order: i + 1 })),
  ];
}

function IconFor({ name, size = 14 }) {
  const Comp = ICONS[name] ?? Info;
  return <Comp size={size} />;
}

export function InfoSectionsEditor({ sections, onChange }) {
  const normalized = useMemo(() => normalize(sections), [sections]);
  const [openId, setOpenId] = useState("description");
  const [showMenu, setShowMenu] = useState(false);

  const usedLabels = new Set(normalized.map((s) => s.label.toLowerCase()));
  const availablePresets = PRESETS.filter(
    (p) => !usedLabels.has(p.label.toLowerCase()),
  );

  const addSection = (preset) => {
    onChange([
      ...normalized,
      {
        id: uid(),
        label: preset.label,
        icon: preset.icon,
        content: "",
        order: normalized.length,
      },
    ]);
    setShowMenu(false);
  };

  const updateSection = (id, patch) => {
    onChange(normalized.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id) => {
    if (id === "description") return;
    onChange(normalized.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-2">
      {normalized.map((section) => {
        const isOpen = openId === section.id;
        const isLocked = section.id === "description";
        const hasContent = section.content.trim().length > 0;
        return (
          <div
            key={section.id}
            className="rounded-xl border border-border bg-background overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent/30 transition-colors text-left">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="flex-1 flex items-center gap-2.5 -mx-3 px-3"
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    hasContent
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <IconFor name={section.icon} size={13} />
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {section.label}
                    </span>
                    {isLocked && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        requerida
                      </span>
                    )}
                  </div>
                  {hasContent && !isOpen && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {section.content.slice(0, 80)}
                      {section.content.length > 80 ? "…" : ""}
                    </p>
                  )}
                </div>
                <ChevronDown
                  size={13}
                  className={cn(
                    "text-muted-foreground shrink-0 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {!isLocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id);
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label={`Eliminar ${section.label}`}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            {isOpen && (
              <div className="border-t border-border p-3 space-y-2 bg-secondary/20">
                {!isLocked && (
                  <Input
                    value={section.label}
                    onChange={(e) =>
                      updateSection(section.id, { label: e.target.value })
                    }
                    placeholder="Nombre de la sección"
                    className="h-9 rounded-lg text-sm font-medium"
                  />
                )}
                {section.label.toLowerCase().includes("tiempo") ? (
                  <Input
                    type="number"
                    value={section.content}
                    onChange={(e) =>
                      updateSection(section.id, { content: e.target.value })
                    }
                    placeholder="Tiempo de preparación (minutos)"
                    className="rounded-lg text-sm font-medium"
                  />
                ) : (
                  <Textarea
                    value={section.content}
                    onChange={(e) =>
                      updateSection(section.id, { content: e.target.value })
                    }
                    placeholder={
                      isLocked
                        ? "Escribí una descripción atractiva del producto..."
                        : `Contenido de "${section.label}"...`
                    }
                    rows={4}
                    className="resize-none text-sm rounded-lg"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add menu */}
      {availablePresets.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent/30 transition-colors"
          >
            <Plus size={13} />
            Agregar sección
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 right-0 top-12 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                {availablePresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => addSection(p)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/40 transition-colors text-left"
                  >
                    <span className="w-6 h-6 rounded-md bg-secondary text-foreground flex items-center justify-center">
                      <IconFor name={p.icon} size={11} />
                    </span>
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Beaker,
  Zap,
  Leaf,
  Info,
  Star,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Tipos predefinidos ────────────────────────────────────────────────────────

const PRESET_ICONS = {
  FileText: ({ size = 14 }) => <FileText size={size} />,
  Beaker: ({ size = 14 }) => <Beaker size={size} />,
  Zap: ({ size = 14 }) => <Zap size={size} />,
  Leaf: ({ size = 14 }) => <Leaf size={size} />,
  Info: ({ size = 14 }) => <Info size={size} />,
  Star: ({ size = 14 }) => <Star size={size} />,
  AlertTriangle: ({ size = 14 }) => <AlertTriangle size={size} />,
  Package: ({ size = 14 }) => <Package size={size} />,
};

const PRESETS = [
  { label: "Ingredientes", icon: "Beaker" },
  { label: "Modo de uso", icon: "Zap" },
  { label: "Beneficios", icon: "Leaf" },
  { label: "Información nutricional", icon: "Info" },
  { label: "Recomendaciones", icon: "Star" },
  { label: "Advertencias", icon: "AlertTriangle" },
  { label: "Contenido del paquete", icon: "Package" },
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

function IconComp({ name, size = 14 }) {
  const Comp = PRESET_ICONS[name] ?? PRESET_ICONS.Info;
  return <Comp size={size} />;
}

function normalizeSections(sections = []) {
  const withoutDescription = sections.filter(
    (s) => s.id !== DEFAULT_DESCRIPTION.id,
  );

  return [
    {
      ...DEFAULT_DESCRIPTION,
      ...sections.find((s) => s.id === DEFAULT_DESCRIPTION.id),
      order: 0,
    },
    ...withoutDescription.map((s, index) => ({
      ...s,
      order: index + 1,
    })),
  ];
}

// ─── SectionRow ───────────────────────────────────────────────────────────────

function SectionRow({ section, index, total, onChange, onRemove, onMove }) {
  const [open, setOpen] = useState(true);
  const isLocked = section.id === DEFAULT_DESCRIPTION.id;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/40">
        <div className="relative">
          <select
            value={section.icon}
            onChange={(e) => onChange({ ...section, icon: e.target.value })}
            disabled={isLocked}
            className="absolute inset-0 opacity-0 w-full cursor-pointer disabled:cursor-default"
          >
            {Object.keys(PRESET_ICONS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 pointer-events-none">
            <IconComp name={section.icon} size={14} />
          </div>
        </div>

        <Input
          value={section.label}
          onChange={(e) => onChange({ ...section, label: e.target.value })}
          placeholder="Nombre de la sección"
          disabled={isLocked}
          className="h-8 text-sm rounded-lg flex-1 border-border"
        />

        {!isLocked && (
          <div className="flex gap-0.5 shrink-0">
            <button
              type="button"
              disabled={index === 1}
              onClick={() => onMove("up")}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
            >
              <ChevronUp size={12} />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMove("down")}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
            >
              <ChevronDown size={12} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {!isLocked && (
          <button
            type="button"
            onClick={onRemove}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3 pt-2">
          <Textarea
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            placeholder={`Contenido de "${section.label}"...`}
            rows={4}
            className="resize-none text-sm rounded-xl border-border w-full"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InfoSectionsEditor({
  sections,
  onChange,
  productTitle = "",
}) {
  const normalizedSections = useMemo(
    () => normalizeSections(sections),
    [sections],
  );

  const addSection = useCallback(
    (preset) => {
      const newSection = {
        id: uid(),
        label: preset?.label ?? "Nueva sección",
        icon: preset?.icon ?? "Info",
        content: "",
        order: normalizedSections.length,
      };

      onChange([...normalizedSections, newSection]);
    },
    [normalizedSections, onChange],
  );

  const updateSection = useCallback(
    (index, updated) => {
      const next = [...normalizedSections];
      next[index] = updated;

      onChange(
        next.map((s, i) => ({
          ...s,
          order: i,
        })),
      );
    },
    [normalizedSections, onChange],
  );

  const removeSection = useCallback(
    (index) => {
      const target = normalizedSections[index];
      if (target?.id === DEFAULT_DESCRIPTION.id) return;

      onChange(normalizedSections.filter((_, i) => i !== index));
    },
    [normalizedSections, onChange],
  );

  const moveSection = useCallback(
    (index, dir) => {
      if (index === 0) return; // nunca mover Descripción

      const next = [...normalizedSections];
      const target = dir === "up" ? index - 1 : index + 1;

      if (target < 1 || target >= next.length) return;

      [next[index], next[target]] = [next[target], next[index]];

      onChange(
        next.map((s, i) => ({
          ...s,
          order: i,
        })),
      );
    },
    [normalizedSections, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {normalizedSections.map((section, i) => (
          <SectionRow
            key={section.id}
            section={section}
            index={i}
            total={normalizedSections.length}
            onChange={(s) => updateSection(i, s)}
            onRemove={() => removeSection(i)}
            onMove={(dir) => moveSection(i, dir)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const menu = document.getElementById("info-sections-menu");
              if (menu) menu.classList.toggle("hidden");
            }}
            className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
          >
            <Plus size={14} />
            Agregar sección
            <ChevronDown size={12} />
          </button>

          <div
            id="info-sections-menu"
            className="hidden absolute left-0 top-10 z-50 bg-background border border-border rounded-xl shadow-md overflow-hidden min-w-52"
          >
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  addSection(p);
                  const menu = document.getElementById("info-sections-menu");
                  if (menu) menu.classList.add("hidden");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left"
              >
                <span className="text-primary w-4 flex items-center justify-center">
                  <IconComp name={p.icon} size={13} />
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

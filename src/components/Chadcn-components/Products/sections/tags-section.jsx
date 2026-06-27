"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = ["nuevo", "oferta", "destacado", "limitado"];

export function TagsSection({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput("");
  };

  const remove = (t) => onChange(tags.filter((x) => x !== t));

  const unusedSuggestions = SUGGESTIONS.filter((s) => !tags.includes(s));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          className="h-10 rounded-xl text-sm"
          placeholder="Ej: verano, sin alcohol, vegano..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          disabled={!input.trim()}
          className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => remove(tag)}
              className="inline-flex items-center gap-1.5 text-xs bg-secondary border border-border text-foreground pl-3 pr-2 py-1.5 rounded-full hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors group"
            >
              {tag}
              <X size={11} className="opacity-60 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Sugerencias:
          </span>
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

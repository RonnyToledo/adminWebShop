"use client";

import React from "react";

import { Eye, EyeOff, Maximize2, ShoppingBag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function Row({ label, description, checked, onCheckedChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-border bg-background hover:bg-accent/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            checked
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {label}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function VisibilitySection({ visible, venta, span, onChange }) {
  return (
    <div className="space-y-2">
      <Row
        label="Visible en la tienda"
        description="Los clientes pueden ver este producto en el catálogo"
        checked={visible}
        onCheckedChange={(v) => onChange({ visible: v })}
        icon={visible ? Eye : EyeOff}
      />
      <Row
        label="Disponible para compra"
        description="Aparece con botón de comprar / agregar al carrito"
        checked={venta}
        onCheckedChange={(v) => onChange({ venta: v })}
        icon={ShoppingBag}
      />
      <Row
        label="Destacado (doble espacio)"
        description="Ocupa más espacio en el listado de la tienda"
        checked={span}
        onCheckedChange={(v) => onChange({ span: v })}
        icon={Maximize2}
      />
    </div>
  );
}

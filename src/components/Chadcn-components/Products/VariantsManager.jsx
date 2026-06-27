"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import {
  BarChart2,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Info,
  Layers,
  Package,
  Palette,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ThemeContext } from "@/context/useContext";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ATTRIBUTE_SUGGESTIONS = [
  "talla",
  "color",
  "género",
  "material",
  "sabor",
  "estilo",
  "edad",
  "capacidad",
];

const COLOR_ATTR_KEYS = ["color", "colour", "color_variante", "color variante"];

const ATTRIBUTE_PRESETS = {
  talla: { type: "text", values: ["XS", "S", "M", "L", "XL", "XXL"] },
  color: {
    type: "color",
    values: [
      { hex: "#000000", name: "Negro" },
      { hex: "#ffffff", name: "Blanco" },
      { hex: "#ef4444", name: "Rojo" },
      { hex: "#3b82f6", name: "Azul" },
      { hex: "#22c55e", name: "Verde" },
    ],
  },
  sabor: { type: "text", values: ["Vainilla", "Chocolate", "Fresa", "Menta"] },
  género: { type: "text", values: ["Hombre", "Mujer", "Unisex"] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeImage = (img) =>
  img && typeof img === "string" && img.trim() !== "" ? img : null;

function variantLabel(attributes) {
  return (
    Object.entries(attributes)
      .filter(([k]) => k !== "es_default")
      .map(([, v]) => (typeof v === "object" && v ? v.name : v))
      .join(" / ") || "Variante principal"
  );
}

function variantColorDot(attributes) {
  for (const [, v] of Object.entries(attributes)) {
    if (typeof v === "object" && v && v.hex) return v.hex;
  }
  return null;
}

function cartesian(attrMap) {
  const keys = Object.keys(attrMap).filter((k) => attrMap[k].values.length > 0);
  if (!keys.length) return [];
  let result = [{}];
  for (const key of keys) {
    const next = [];
    for (const combo of result) {
      for (const val of attrMap[key].values) {
        next.push({ ...combo, [key]: val });
      }
    }
    result = next;
  }
  return result;
}

function extractAttrMap(variants) {
  const map = {};
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.attributes ?? {})) {
      if (k === "es_default") continue;
      if (!map[k]) {
        map[k] = {
          type: typeof val === "object" ? "color" : "text",
          values: [],
        };
      }
      const exists = map[k].values.some(
        (x) => JSON.stringify(x) === JSON.stringify(val),
      );
      if (!exists) map[k].values.push(val);
    }
  }
  return map;
}

export function makeDefaultVariant(
  basePrice = 0,
  basePriceCompra = 0,
  stock = 0,
) {
  return {
    id: uuidv4(),
    label: "Variante principal",
    attributes: { es_default: true },
    price: basePrice,
    old_price: 0,
    priceCompra: basePriceCompra,
    embalaje: 0,
    stock,
    image: null,
    images: [],
    visible: true,
    agotado: false,
    default_variant: true,
    orden: 0,
    quantity_discounts: [],
  };
}

// ─── Primitivos UI ────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
      {children}
    </label>
  );
}

function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  accent,
  icon: Icon,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-muted-foreground" />}
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {summary && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accent ?? "bg-secondary text-muted-foreground"}`}
            >
              {summary}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border p-4 space-y-3 bg-background/40">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ColorValueInput ──────────────────────────────────────────────────────────

function ColorValueInput({ onAdd }) {
  const [hex, setHex] = useState("#16a34a");
  const [name, setName] = useState("");

  const add = () => {
    const cleanName = name.trim() || hex;
    if (!cleanName) return;
    onAdd({ hex, name: cleanName });
    setName("");
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex items-center gap-2 flex-1 border border-border rounded-xl pl-1.5 pr-3 py-1.5 bg-card focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
        <label className="relative cursor-pointer shrink-0">
          <span
            className="block w-8 h-8 rounded-lg border-2 border-border shadow-sm"
            style={{
              background: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#16a34a",
            }}
          />
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#16a34a"}
            onChange={(e) => setHex(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          maxLength={7}
          className="w-20 text-xs border-0 p-0 bg-transparent focus:outline-none font-mono uppercase"
          placeholder="#000000"
        />
        <div className="w-px h-5 bg-border" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1 text-sm border-0 p-0 bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
          placeholder="Nombre del color (opcional)"
        />
      </div>
      <button
        type="button"
        onClick={add}
        className="h-10 px-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shrink-0 transition-opacity flex items-center justify-center"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── ValuePill ────────────────────────────────────────────────────────────────

function ValuePill({ label, hex, onRemove }) {
  return (
    <span className="group inline-flex items-center gap-2 h-10 pl-3 pr-2 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all shadow-sm">
      {hex && (
        <span
          className="w-5 h-5 rounded-md border border-border/60 shadow-sm shrink-0"
          style={{ background: hex }}
        />
      )}
      <span className="text-sm font-medium text-foreground">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          aria-label={`Quitar ${label}`}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}

function AddPill({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/40 transition-colors"
    >
      <Plus size={14} />
      <span className="text-xs font-medium">Agregar</span>
    </button>
  );
}

// ─── ImageUploader (compacto, igual al de QuickEssentials) ────────────────────

function ImageUploader({ currentImage, localBlob, onFileSelect, onRemove }) {
  const fileRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!localBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(localBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localBlob]);

  const displaySrc = previewUrl ?? normalizeImage(currentImage) ?? null;

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) onFileSelect(file);
  };

  return (
    <div>
      {displaySrc ? (
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary group">
          <Image
            src={displaySrc || "/placeholder.svg"}
            alt="Variante"
            fill
            sizes="180px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-end justify-between gap-1 p-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="text-[11px] font-medium px-2.5 h-7 rounded-md bg-background/95 text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              <Upload size={11} /> Cambiar
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Quitar imagen"
              className="w-7 h-7 rounded-md bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Trash2 size={11} />
            </button>
          </div>
          {previewUrl && (
            <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">
              Sin guardar
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "aspect-square w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-secondary/30 hover:bg-accent/40 hover:border-primary/40",
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
            <Upload
              size={16}
              className={isDragging ? "text-primary" : "text-muted-foreground"}
            />
          </div>
          <p className="text-[13px] font-medium text-foreground">
            Subir imagen
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Arrastrá o hacé clic
            <br />
            <span className="text-muted-foreground/70">
              Opcional · PNG, JPG hasta 10MB
            </span>
          </p>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── PriceFields para variantes secundarias ───────────────────────────────────
// La lógica de old_price es AUTOMÁTICA: cuando el precio cambia a uno menor,
// updateVariant() guarda el precio anterior en old_price automáticamente.
// Esto mantiene consistencia con QuickEssentials y la API.

function VariantPriceFields({ v, onUpdate, stockMode = "number" }) {
  const margin = (() => {
    const p = Number(v.price);
    const c = Number(v.priceCompra ?? 0);
    const e = Number(v.embalaje ?? 0);
    if (p <= 0 || c <= 0) return null;
    const totalCost = c + e;
    return {
      m: Math.max(0, Math.round(((p - totalCost) / p) * 100)),
      gain: (p - totalCost).toFixed(2),
    };
  })();

  return (
    <div className="space-y-3">
      {/* Precio + Stock */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>
            Precio<span className="text-destructive ml-0.5">*</span>
          </FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={v.price ?? ""}
            placeholder="0"
            className="h-11 rounded-xl text-[15px] font-semibold tabular-nums"
            onChange={(e) => {
              const newPrice = parseFloat(e.target.value) || 0;
              // updateVariant maneja automáticamente guardar old_price si el nuevo precio es menor
              onUpdate(v.id, "price", newPrice);
            }}
          />
        </div>
        <div>
          <FieldLabel>
            Stock<span className="text-destructive ml-0.5">*</span>
          </FieldLabel>
          {stockMode === "switch" ? (
            <div className="flex items-center gap-2 h-11">
              <Switch
                checked={Number(v.stock) > 0}
                onCheckedChange={(c) => onUpdate(v.id, "stock", c ? 1 : 0)}
              />
              <span className="text-sm text-muted-foreground">
                {Number(v.stock) > 0 ? "En stock" : "Agotado"}
              </span>
            </div>
          ) : (
            <Input
              type="number"
              value={v.stock ?? ""}
              placeholder="0"
              className="h-11 rounded-xl tabular-nums"
              onChange={(e) =>
                onUpdate(v.id, "stock", parseInt(e.target.value) || 0)
              }
            />
          )}
        </div>
      </div>

      {/* Precio de compra + Embalaje */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Precio de compra</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={v.priceCompra ?? ""}
            placeholder="0"
            className="h-11 rounded-xl tabular-nums"
            onChange={(e) =>
              onUpdate(v.id, "priceCompra", parseFloat(e.target.value) || 0)
            }
          />
        </div>
        <div>
          <FieldLabel>Embalaje</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={v.embalaje ?? ""}
            placeholder="0"
            className="h-11 rounded-xl tabular-nums"
            onChange={(e) =>
              onUpdate(v.id, "embalaje", parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      {/* Margen calculado */}
      {margin && (
        <div className="flex items-center gap-1.5 text-xs text-foreground bg-accent/40 border border-accent rounded-lg px-3 py-2">
          <Info size={11} className="shrink-0 text-primary" />
          Margen: <span className="font-semibold">{margin.m}%</span> · ganás $
          {margin.gain} por unidad
          {Number(v.embalaje) > 0 && (
            <span className="text-muted-foreground ml-1">(c/embalaje)</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── QuantityDiscounts ────────────────────────────────────────────────────────

const QD_TYPES = [
  { value: "quantity", label: "Precio x u." },
  { value: "percentage", label: "Porcentaje %" },
  { value: "fixed", label: "Precio fijo" },
];

function QuantityDiscounts({ variantId, productId, discounts = [], onChange }) {
  const [open, setOpen] = useState(discounts.length > 0);

  const add = () => {
    setOpen(true);
    onChange([
      ...discounts,
      {
        id: null,
        variant_id: variantId,
        product_id: productId,
        min_qty: 2,
        max_qty: null,
        type: "quantity",
        value: 0,
      },
    ]);
  };

  const remove = (idx) => onChange(discounts.filter((_, i) => i !== idx));
  const update = (idx, field, val) =>
    onChange(discounts.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center justify-between py-2 text-left group"
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          <BarChart2 size={11} />
          Descuentos por cantidad
          {discounts.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {discounts.length}
            </span>
          )}
          {discounts.length === 0 && (
            <span className="text-[10px] text-muted-foreground/60">
              (opcional)
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={11} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={11} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="pt-2 space-y-2 border-t border-border/60">
          <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
            Al comprar ≥ mín. unidades aplica el descuento.{" "}
            <strong>Precio x u.</strong>: nuevo precio unitario.{" "}
            <strong>Porcentaje</strong>: % de descuento.{" "}
            <strong>Precio fijo</strong>: precio total del lote.
          </p>

          {discounts.length > 0 && (
            <>
              <div className="grid grid-cols-[56px_56px_1fr_72px_28px] gap-1.5">
                {["Mín.", "Máx.", "Tipo", "Valor", ""].map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {discounts.map((d, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[56px_56px_1fr_72px_28px] gap-1.5 items-center"
                >
                  <Input
                    type="number"
                    className="h-7 text-xs px-2"
                    value={d.min_qty ?? ""}
                    placeholder="2"
                    min={1}
                    onChange={(e) =>
                      update(idx, "min_qty", parseInt(e.target.value) || 1)
                    }
                  />
                  <Input
                    type="number"
                    className="h-7 text-xs px-2"
                    value={d.max_qty ?? ""}
                    placeholder="∞"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      update(idx, "max_qty", isNaN(val) ? null : val);
                    }}
                  />
                  <select
                    className="h-7 text-xs border border-border rounded-lg px-1.5 bg-background text-foreground w-full"
                    value={d.type}
                    onChange={(e) => update(idx, "type", e.target.value)}
                  >
                    {QD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    className="h-7 text-xs px-2"
                    value={d.value ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      update(idx, "value", parseFloat(e.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="h-7 w-7 rounded-md border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </>
          )}

          <button
            type="button"
            onClick={add}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-lg py-1.5 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus size={10} /> Agregar tramo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── VariantRow (secundaria) — layout igual a QuickEssentials ─────────────────
// imagen a la izquierda, campos a la derecha; sin old_price

function VariantRow({
  v,
  onUpdate,
  onRemove,
  variantImageBlobs,
  setVariantImageBlobs,
}) {
  const { webshop } = useContext(ThemeContext);
  const [expanded, setExpanded] = useState(false);

  const colorHex = variantColorDot(v.attributes);
  const localBlob = variantImageBlobs.get(v.id) ?? null;
  const stockMode = webshop?.store?.stocks ? "number" : "switch";

  const [thumbUrl, setThumbUrl] = useState(null);
  useEffect(() => {
    if (!localBlob) {
      setThumbUrl(null);
      return;
    }
    const url = URL.createObjectURL(localBlob);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localBlob]);

  const normalizedImage = normalizeImage(v.image);
  const thumbnailSrc = thumbUrl ?? normalizedImage ?? null;
  const totalStock = Number(v.stock) || 0;
  const qdCount = v.quantity_discounts?.length ?? 0;

  const stockBadge = !v.visible
    ? { label: "oculta", cls: "bg-secondary text-muted-foreground" }
    : totalStock === 0 || v.agotado
      ? { label: "sin stock", cls: "bg-amber-100 text-amber-700" }
      : { label: "activa", cls: "bg-primary/10 text-primary" };

  const handleFileSelect = (file) =>
    setVariantImageBlobs((m) => {
      const next = new Map(m);
      next.set(v.id, file);
      return next;
    });

  const handleRemoveImage = () => {
    setVariantImageBlobs((m) => {
      const next = new Map(m);
      next.delete(v.id);
      return next;
    });
    onUpdate(v.id, { image: null, _deleteImage: normalizedImage });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header colapsable */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Thumbnail / dot de color */}
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border shrink-0 overflow-hidden flex items-center justify-center">
            {thumbnailSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailSrc}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : colorHex ? (
              <span
                className="w-5 h-5 rounded-md border border-border/50"
                style={{ background: colorHex }}
              />
            ) : (
              <ImageIcon size={14} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {variantLabel(v.attributes)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground tabular-nums">
                ${Number(v.price || 0).toLocaleString()}
              </span>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">
                {totalStock} u.
              </span>
              {qdCount > 0 && (
                <>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-[10px] text-primary">
                    {qdCount} desc.
                  </span>
                </>
              )}
              {localBlob && (
                <>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-[10px] text-amber-600">foto ↑</span>
                </>
              )}
              {normalizedImage && !localBlob && (
                <>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-[10px] text-primary">📷</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stockBadge.cls}`}
          >
            {stockBadge.label}
          </span>
          {expanded ? (
            <ChevronUp size={12} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded: layout igual a QuickEssentials — imagen izq, campos der */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-background/40">
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-[180px_1fr]">
            {/* Imagen */}
            <ImageUploader
              currentImage={v.image}
              localBlob={localBlob}
              onFileSelect={handleFileSelect}
              onRemove={handleRemoveImage}
            />

            {/* Campos: precio, stock, precio compra, embalaje */}
            <VariantPriceFields
              v={v}
              onUpdate={onUpdate}
              stockMode={stockMode}
            />
          </div>

          {/* Descuentos por cantidad */}
          <div className="border-t border-border/60 pt-2">
            <QuantityDiscounts
              variantId={v.id}
              productId={v.product_id}
              discounts={v.quantity_discounts ?? []}
              onChange={(qd) => onUpdate(v.id, { quantity_discounts: qd })}
            />
          </div>

          {/* Eliminar */}
          <button
            type="button"
            onClick={() => onRemove(v.id)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive border border-destructive/20 rounded-lg py-1.5 hover:bg-destructive/5 transition-colors"
          >
            <X size={11} /> Eliminar variante
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AttributeEditor ──────────────────────────────────────────────────────────

function AttributeEditor({
  attrKey,
  type,
  values,
  onChangeType,
  onAddTextValue,
  onAddColorValue,
  onRemoveValue,
  onRemoveAttribute,
  inputValue,
  setInputValue,
}) {
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const inputRef = useRef(null);

  const presetKey = attrKey.toLowerCase();
  const preset = ATTRIBUTE_PRESETS[presetKey];
  const hasUnusedPreset =
    preset &&
    preset.type === type &&
    preset.values.some((pv) =>
      type === "color"
        ? !values.some((v) => typeof v === "object" && v.hex === pv.hex)
        : !values.includes(pv),
    );

  const applyPreset = () => {
    if (!preset) return;
    if (type === "color") {
      preset.values.forEach((pv) => {
        if (!values.some((v) => typeof v === "object" && v.hex === pv.hex))
          onAddColorValue(pv);
      });
    } else {
      preset.values.forEach((pv) => {
        if (!values.includes(pv)) {
          setInputValue(pv);
          setTimeout(() => onAddTextValue(), 0);
        }
      });
    }
  };

  const handleQuickAddValue = (val) => {
    if (values.includes(val)) return;
    setInputValue(val);
    setTimeout(() => onAddTextValue(), 0);
  };

  return (
    <div
      className={cn(
        "relative border-2 rounded-2xl overflow-hidden transition-all",
        type === "color"
          ? "border-purple-200 bg-gradient-to-br from-purple-50/40 to-transparent"
          : "border-border bg-gradient-to-br from-accent/20 to-transparent",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-bold capitalize text-foreground tracking-tight">
            {attrKey}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
              type === "color"
                ? "bg-purple-100 text-purple-700"
                : "bg-primary/10 text-primary",
            )}
          >
            {type === "color" ? (
              <>
                <Palette size={9} /> color
              </>
            ) : (
              <>
                <Type size={9} /> texto
              </>
            )}
          </span>
          {values.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {values.length} {values.length === 1 ? "valor" : "valores"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            className="text-[11px] border border-border rounded-lg px-2 py-1 bg-background text-foreground hover:bg-accent/40 transition-colors"
            value={type}
            onChange={(e) => onChangeType(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="text">texto</option>
            <option value="color">color</option>
          </select>
          <button
            type="button"
            onClick={onRemoveAttribute}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Eliminar opción ${attrKey}`}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Preset rápido */}
        {hasUnusedPreset && values.length === 0 && (
          <button
            type="button"
            onClick={applyPreset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary text-xs font-medium transition-colors"
          >
            <Sparkles size={12} />
            Usar preset{" "}
            {type === "color"
              ? "(colores básicos)"
              : `(${preset.values.slice(0, 3).join(", ")}...)`}
          </button>
        )}

        {/* Pills de valores */}
        <div className="flex flex-wrap gap-2">
          {values.length === 0 && !showInlineAdd && (
            <span className="text-xs text-muted-foreground italic flex items-center h-10">
              Sin valores aún · agregá el primero ↓
            </span>
          )}
          {values.map((val, idx) =>
            type === "color" ? (
              <ValuePill
                key={idx}
                label={val.name ?? val.hex}
                hex={val.hex}
                onRemove={() => onRemoveValue(idx)}
              />
            ) : (
              <ValuePill
                key={idx}
                label={String(val)}
                onRemove={() => onRemoveValue(idx)}
              />
            ),
          )}
          {type === "text" && !showInlineAdd && values.length > 0 && (
            <AddPill
              onClick={() => {
                setShowInlineAdd(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            />
          )}
        </div>

        {/* Quick adds desde preset */}
        {type === "text" && values.length === 0 && preset && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">
              Sugerencias:
            </span>
            {preset.values.map((pv) => (
              <button
                key={pv}
                type="button"
                onClick={() => handleQuickAddValue(pv)}
                className="inline-flex items-center h-7 px-2.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/40 transition-colors"
              >
                + {pv}
              </button>
            ))}
          </div>
        )}

        {/* Input para agregar valor */}
        {type === "color" ? (
          <div className="pt-1">
            <ColorValueInput onAdd={onAddColorValue} />
          </div>
        ) : (
          (showInlineAdd || values.length === 0) && (
            <div className="flex gap-2 pt-1">
              <Input
                ref={inputRef}
                className="h-10 text-sm rounded-xl"
                placeholder={`Agregar ${attrKey}... (ej: ${preset?.values[0] ?? "valor"})`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddTextValue();
                  }
                  if (e.key === "Escape") {
                    setShowInlineAdd(false);
                    setInputValue("");
                  }
                }}
                autoFocus={values.length > 0}
              />
              <button
                type="button"
                onClick={onAddTextValue}
                disabled={!inputValue.trim()}
                className="h-10 px-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-opacity flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
              {values.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineAdd(false);
                    setInputValue("");
                  }}
                  className="h-10 px-3 rounded-xl border border-border text-muted-foreground hover:bg-accent/40 shrink-0 transition-colors flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── VariantsManager ─────────────────────────────────────────────────────────

export default function VariantsManager({
  variants = [],
  onChange,
  variantImageBlobs,
  setVariantImageBlobs,
}) {
  const { webshop } = useContext(ThemeContext);

  const defaultVariant =
    variants.find(
      (v) => v.attributes?.es_default === true || v.default_variant === true,
    ) ?? null;

  const realVariants = variants.filter(
    (v) => !(v.attributes?.es_default === true || v.default_variant === true),
  );

  const stockMode = webshop?.store?.stocks ? "number" : "switch";

  const [multiMode, setMultiMode] = useState(() => realVariants.length > 0);
  const [attrMap, setAttrMap] = useState(() => extractAttrMap(realVariants));
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValues, setNewAttrValues] = useState({});
  const [showAttrInput, setShowAttrInput] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const shouldPromoteDefaultRef = useRef(false);

  const prevRealLenRef = useRef(realVariants.length);
  useEffect(() => {
    const prevLen = prevRealLenRef.current;
    prevRealLenRef.current = realVariants.length;
    if (prevLen === 0 && realVariants.length > 0) {
      setMultiMode(true);
      setAttrMap(extractAttrMap(realVariants));
    }
    if (prevLen > 0 && realVariants.length === 0 && variants.length <= 1) {
      setMultiMode(false);
      setAttrMap({});
    }
  }, [realVariants.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureDefault = useCallback((current) => {
    if (
      current.some(
        (v) => v.attributes?.es_default === true || v.default_variant === true,
      )
    )
      return current;
    return [makeDefaultVariant(), ...current];
  }, []);

  const updateVariant = (id, fieldOrObj, value) => {
    const patch =
      typeof fieldOrObj === "object" ? fieldOrObj : { [fieldOrObj]: value };

    // Si se está cambiando el precio a uno MENOR, guardar el anterior en old_price
    // Esto mantiene consistencia con QuickEssentials y la API
    const priceChanged =
      "price" in patch && typeof patch.price === "number" && patch.price > 0;

    onChange(
      variants.map((v) => {
        if (v.id !== id) return v;
        const currentPrice = Number(v.price) || 0;
        const newPrice = Number(patch.price);
        const shouldSetOldPrice =
          priceChanged &&
          newPrice > 0 &&
          newPrice < currentPrice &&
          currentPrice > 0;
        return {
          ...v,
          ...patch,
          ...(shouldSetOldPrice ? { old_price: currentPrice } : {}),
        };
      }),
    );
  };

  // ── syncVariants: genera variantes cruzadas desde attrMap ──────────────────
  // BUG ORIGINAL CORREGIDO: la variable se llamaba "updateddd" (typo)
  // pero se usaba como "updated" → ReferenceError que impedía crear variantes
  const syncVariants = (nextAttrMap) => {
    const combos = cartesian(nextAttrMap);
    if (combos.length === 0) {
      if (!Object.keys(nextAttrMap).length)
        onChange(defaultVariant ? [defaultVariant] : [makeDefaultVariant()]);
      return;
    }

    const currentReals = variants.filter(
      (v) => !(v.attributes?.es_default === true || v.default_variant === true),
    );
    const shouldPromote =
      shouldPromoteDefaultRef.current &&
      currentReals.length === 0 &&
      defaultVariant != null;
    if (shouldPromote) shouldPromoteDefaultRef.current = false;

    // CORRECCIÓN: variable correctamente nombrada "updated" en todo el scope
    const updated = combos.map((attrs, index) => {
      const label = Object.values(attrs)
        .map((v) => (typeof v === "object" ? v.name : v))
        .join(" / ");
      const existing = currentReals.find((rv) => {
        const rvAttrs = Object.fromEntries(
          Object.entries(rv.attributes ?? {}).filter(
            ([k]) => k !== "es_default",
          ),
        );
        return JSON.stringify(rvAttrs) === JSON.stringify(attrs);
      });
      if (existing) return { ...existing, attributes: attrs, label };
      const inh = shouldPromote && index === 0 ? defaultVariant : null;
      return {
        id: inh?.id ?? uuidv4(),
        label,
        attributes: attrs,
        price: inh?.price ?? defaultVariant?.price ?? 0,
        old_price: inh?.old_price ?? 0,
        priceCompra: inh?.priceCompra ?? defaultVariant?.priceCompra ?? 0,
        embalaje: inh?.embalaje ?? defaultVariant?.embalaje ?? 0,
        stock: inh?.stock ?? 1,
        image: inh?.image ?? null,
        images: inh?.images ?? [],
        visible: true,
        agotado: false,
        default_variant: false,
        orden: index,
        quantity_discounts: inh?.quantity_discounts ?? [],
      };
    });

    const newDefault = shouldPromote
      ? {
          ...defaultVariant,
          stock: 0,
          image: null,
          ...(defaultVariant?.image
            ? { _deleteImage: defaultVariant.image }
            : {}),
        }
      : (defaultVariant ?? makeDefaultVariant());

    onChange([newDefault, ...updated]);
  };

  const addAttribute = (forceKey) => {
    const key = (forceKey ?? newAttrKey).trim().toLowerCase();
    if (!key || attrMap[key]) return;
    const inferredType = COLOR_ATTR_KEYS.includes(key) ? "color" : "text";
    setAttrMap((prev) => ({
      ...prev,
      [key]: { type: inferredType, values: [] },
    }));
    setNewAttrKey("");
    setShowAttrInput(false);
  };

  const removeAttribute = (key) => {
    const next = { ...attrMap };
    delete next[key];
    setAttrMap(next);
    syncVariants(next);
  };

  const changeAttrType = (key, type) =>
    setAttrMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], type, values: [] },
    }));

  const addTextValue = (key) => {
    const val = (newAttrValues[key] ?? "").trim();
    if (!val || attrMap[key].values.includes(val)) return;
    const next = {
      ...attrMap,
      [key]: { ...attrMap[key], values: [...attrMap[key].values, val] },
    };
    setAttrMap(next);
    setNewAttrValues((p) => ({ ...p, [key]: "" }));
    syncVariants(next);
  };

  const addColorValue = (key, colorObj) => {
    if (
      attrMap[key].values.some(
        (v) => typeof v === "object" && v.hex === colorObj.hex,
      )
    )
      return;
    const next = {
      ...attrMap,
      [key]: { ...attrMap[key], values: [...attrMap[key].values, colorObj] },
    };
    setAttrMap(next);
    syncVariants(next);
  };

  const removeAttrValue = (key, idx) => {
    const next = {
      ...attrMap,
      [key]: {
        ...attrMap[key],
        values: attrMap[key].values.filter((_, i) => i !== idx),
      },
    };
    setAttrMap(next);
    syncVariants(next);
  };

  const removeVariant = (id) => {
    setVariantImageBlobs((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
    onChange(variants.filter((v) => v.id !== id));
  };

  const enableMulti = () => {
    if (!defaultVariant) onChange([makeDefaultVariant()]);
    setAttrMap({});
    setMultiMode(true);
    setShowAttrInput(true);
    shouldPromoteDefaultRef.current = true;
  };

  const disableMulti = () => {
    for (const rv of realVariants) {
      setVariantImageBlobs((m) => {
        const next = new Map(m);
        next.delete(rv.id);
        return next;
      });
    }
    setAttrMap({});
    setMultiMode(false);
    shouldPromoteDefaultRef.current = false;
    onChange([defaultVariant ?? makeDefaultVariant()]);
    setShowConfirmDisable(false);
  };

  // ── MODO SIMPLE ──────────────────────────────────────────────────────────────
  // La variante default ya vive completamente en QuickEssentials (imagen,
  // precio, stock, priceCompra, embalaje). Aquí solo mostramos el toggle para
  // activar variantes múltiples y los descuentos por cantidad de esa variante.
  if (!multiMode) {
    return (
      <div className="space-y-3">
        {/* Descuentos por cantidad de la variante principal */}
        {defaultVariant && (
          <div className="border border-border rounded-xl px-3 py-2 bg-background">
            <QuantityDiscounts
              variantId={defaultVariant.id}
              productId={defaultVariant.product_id}
              discounts={defaultVariant.quantity_discounts ?? []}
              onChange={(qd) => {
                const patch = { quantity_discounts: qd };
                onChange(
                  ensureDefault(
                    variants.map((v) =>
                      v.attributes?.es_default === true ||
                      v.default_variant === true
                        ? { ...v, ...patch }
                        : v,
                    ),
                  ),
                );
              }}
            />
          </div>
        )}

        {/* Toggle para activar variantes múltiples */}
        <div className="relative overflow-hidden flex items-center justify-between gap-3 px-4 py-3.5 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                ¿Tiene colores, tallas u otras opciones?
              </p>
              <p className="text-xs text-muted-foreground">
                Activá para gestionar cada combinación por separado
              </p>
            </div>
          </div>
          <Switch
            checked={false}
            onCheckedChange={(c) => {
              if (c) enableMulti();
            }}
          />
        </div>
      </div>
    );
  }

  // ── MODO MULTI-VARIANTE ───────────────────────────────────────────────────────
  const totalVariants = realVariants.length + (defaultVariant ? 1 : 0);
  const totalStock =
    realVariants.reduce((s, v) => s + (Number(v.stock) || 0), 0) +
    (Number(defaultVariant?.stock) || 0);
  const withStock =
    realVariants.filter((v) => Number(v.stock) > 0).length +
    (Number(defaultVariant?.stock) > 0 ? 1 : 0);

  const unusedSuggestions = ATTRIBUTE_SUGGESTIONS.filter((s) => !attrMap[s]);

  return (
    <div className="space-y-3">
      {/* Stats — solo cuando ya hay variantes secundarias */}
      {realVariants.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: Package,
              val: totalVariants,
              label: "variantes",
              tone: "primary",
            },
            {
              icon: BarChart2,
              val: totalStock,
              label: "unidades",
              tone: "muted",
            },
            {
              icon: Tag,
              val: withStock,
              label: "con stock",
              tone: withStock > 0 ? "primary" : "muted",
            },
          ].map(({ icon: Icon, val, label, tone }) => (
            <div
              key={label}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2.5 border rounded-xl",
                tone === "primary"
                  ? "bg-primary/5 border-primary/20"
                  : "bg-secondary/30 border-border",
              )}
            >
              <Icon
                size={14}
                className={
                  tone === "primary"
                    ? "text-primary mb-1"
                    : "text-muted-foreground mb-1"
                }
              />
              <p className="text-lg font-bold text-foreground leading-none">
                {val}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Sección 1: Opciones (attrMap) ── */}
      <CollapsibleSection
        title="Opciones del producto"
        icon={Sparkles}
        summary={
          Object.keys(attrMap).length > 0
            ? `${Object.keys(attrMap).length} opción${Object.keys(attrMap).length !== 1 ? "es" : ""}`
            : "sin configurar"
        }
        accent={
          Object.keys(attrMap).length > 0
            ? "bg-primary/15 text-primary"
            : "bg-amber-100 text-amber-700"
        }
        defaultOpen={Object.keys(attrMap).length === 0}
      >
        <p className="text-[11px] text-muted-foreground">
          Cada opción con sus valores genera automáticamente las variantes
          combinadas.
        </p>

        {Object.entries(attrMap).map(([key, { type, values }]) => (
          <AttributeEditor
            key={key}
            attrKey={key}
            type={type}
            values={values}
            onChangeType={(t) => changeAttrType(key, t)}
            onAddTextValue={() => addTextValue(key)}
            onAddColorValue={(c) => addColorValue(key, c)}
            onRemoveValue={(idx) => removeAttrValue(key, idx)}
            onRemoveAttribute={() => removeAttribute(key)}
            inputValue={newAttrValues[key] ?? ""}
            setInputValue={(v) => setNewAttrValues((p) => ({ ...p, [key]: v }))}
          />
        ))}

        {/* Agregar nueva opción */}
        {showAttrInput ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre (ej: color, talla, sabor)"
                className="h-10 text-sm rounded-xl"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAttribute();
                  }
                  if (e.key === "Escape") {
                    setShowAttrInput(false);
                    setNewAttrKey("");
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => addAttribute()}
                disabled={!newAttrKey.trim()}
                className="h-10 px-3.5 rounded-xl bg-primary text-primary-foreground text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttrInput(false);
                  setNewAttrKey("");
                }}
                className="h-10 px-3 rounded-xl border border-border text-muted-foreground shrink-0 hover:bg-accent/40 transition-colors flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
            {unusedSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">
                  Sugerencias:
                </span>
                {unusedSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addAttribute(s)}
                    className="inline-flex items-center h-7 px-2.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/40 transition-colors capitalize"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAttrInput(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl py-3 hover:border-primary/40 hover:text-primary hover:bg-accent/30 transition-colors font-medium"
          >
            <Plus size={14} /> Agregar opción
          </button>
        )}
      </CollapsibleSection>

      {/* ── Sección 2: Variantes secundarias generadas ── */}
      {realVariants.length > 0 && (
        <CollapsibleSection
          title="Variantes"
          icon={Package}
          summary={`${realVariants.length} ${realVariants.length === 1 ? "variante" : "variantes"}`}
          accent="bg-secondary text-muted-foreground"
          defaultOpen
        >
          <div className="space-y-2">
            {/* Divisor explicativo */}
            <div className="flex items-center gap-2 pb-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Variantes secundarias
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {realVariants.map((v) => (
              <VariantRow
                key={v.id}
                v={v}
                onUpdate={updateVariant}
                onRemove={removeVariant}
                variantImageBlobs={variantImageBlobs}
                setVariantImageBlobs={setVariantImageBlobs}
              />
            ))}

            {/* Agregar variante manual */}
            <button
              type="button"
              onClick={() =>
                onChange([
                  ...variants,
                  {
                    id: uuidv4(),
                    label: "Nueva variante",
                    attributes: {},
                    price: defaultVariant?.price ?? 0,
                    old_price: 0,
                    priceCompra: defaultVariant?.priceCompra ?? 0,
                    embalaje: defaultVariant?.embalaje ?? 0,
                    stock: 0,
                    image: null,
                    images: [],
                    visible: true,
                    agotado: false,
                    default_variant: false,
                    orden: realVariants.length,
                    quantity_discounts: [],
                  },
                ])
              }
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-xl py-2 hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus size={12} /> Agregar variante manual
            </button>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Toggle para desactivar multi ── */}
      {!showConfirmDisable ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border border-border rounded-xl bg-card">
          <div>
            <p className="text-sm font-medium text-foreground">
              Variantes múltiples
            </p>
            <p className="text-xs text-muted-foreground">
              Desactiva para volver a variante única
            </p>
          </div>
          <Switch
            checked
            onCheckedChange={(c) => {
              if (!c) setShowConfirmDisable(true);
            }}
          />
        </div>
      ) : (
        <div className="border border-destructive/30 rounded-xl p-4 space-y-3 bg-destructive/5">
          <p className="text-sm font-medium text-foreground">
            ¿Desactivar variantes?
          </p>
          <p className="text-xs text-muted-foreground">
            Se eliminarán todas las combinaciones. Los datos de la variante
            principal se conservan.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={disableMulti}
              className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Sí, desactivar
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDisable(false)}
              className="flex-1 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-accent/40 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

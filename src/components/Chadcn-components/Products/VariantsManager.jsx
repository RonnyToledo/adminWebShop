"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Trash2,
  Info,
  Upload,
  Palette,
  Type,
  Package,
  Tag,
  BarChart2,
  Settings2,
} from "lucide-react";
import { ThemeContext } from "@/context/useContext";
import Image from "next/image";

// ─── helpers ──────────────────────────────────────────────────────────────────

const normalizeImage = (img) =>
  img && typeof img === "string" && img.trim() !== "" ? img : null;

function variantLabel(attributes) {
  return (
    Object.entries(attributes)
      .filter(([k]) => k !== "es_default")
      .map(([, v]) => (typeof v === "object" ? v.name : v))
      .join(" / ") || "Variante principal"
  );
}

function variantColorDot(attributes) {
  for (const [, v] of Object.entries(attributes)) {
    if (typeof v === "object" && v.hex) return v.hex;
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
      if (!map[k])
        map[k] = {
          type: typeof val === "object" ? "color" : "text",
          values: [],
        };
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

const COLOR_ATTR_KEYS = ["color", "colour", "colores", "colours"];

// ─── Primitivos UI ────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">
      {children}
    </label>
  );
}

// Sección colapsable genérica con badge de resumen
function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  accent,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {summary && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accent ?? "bg-secondary text-muted-foreground"}`}
            >
              {summary}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={13} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={13} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border p-4 space-y-3 bg-background">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ColorValueInput ──────────────────────────────────────────────────────────

function ColorValueInput({ onAdd }) {
  const [hex, setHex] = useState("#D4537E");
  const [name, setName] = useState("");
  const add = () => {
    const cleanName = name.trim() || hex;
    if (!cleanName) return;
    onAdd({ hex, name: cleanName });
    setName("");
  };
  return (
    <div className="flex gap-2 items-center">
      <div className="flex items-center gap-2 flex-1 border border-border rounded-xl px-3 py-1.5">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#D4537E"}
          onChange={(e) => setHex(e.target.value)}
          className="w-7 h-7 rounded-md border-0 cursor-pointer p-0 bg-transparent"
          style={{ minWidth: 28 }}
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          maxLength={7}
          className="w-20 text-xs border-0 p-0 bg-transparent focus:outline-none font-mono"
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
          className="flex-1 text-xs border-0 p-0 bg-transparent focus:outline-none"
          placeholder="Nombre del color"
        />
      </div>
      <button
        type="button"
        onClick={add}
        className="h-9 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 shrink-0 transition-colors"
      >
        +
      </button>
    </div>
  );
}

function ColorPill({ value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-background border border-border rounded-full pl-1.5 pr-2.5 py-0.5 text-xs text-foreground">
      <span
        className="w-3.5 h-3.5 rounded-full border border-border/50 shrink-0"
        style={{ background: value.hex }}
      />
      {value.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-destructive ml-0.5"
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

function TextPill({ value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-background border border-border rounded-full px-2.5 py-0.5 text-xs text-foreground">
      {value}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-destructive"
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

// ─── ImageUploader ────────────────────────────────────────────────────────────

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
      <FieldLabel>Imagen (opcional)</FieldLabel>
      {displaySrc ? (
        <div className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5 bg-secondary/10">
          <div className="relative size-20 rounded-lg overflow-hidden border border-border shrink-0">
            <Image
              width={80}
              height={80}
              src={displaySrc}
              alt=""
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-destructive/90 flex items-center justify-center text-white"
            >
              <Trash2 size={9} />
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {localBlob ? "Nueva imagen (sin guardar)" : "Imagen guardada"}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="text-xs text-primary underline underline-offset-2"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`mt-1 flex flex-col items-center justify-center gap-1.5 px-4 pt-4 pb-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <Upload
            size={20}
            className={`transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`}
          />
          <p className="text-xs text-foreground">
            <span className="text-primary font-medium underline underline-offset-2">
              Subir imagen
            </span>{" "}
            o arrastra aquí
          </p>
          <p className="text-[10px] text-muted-foreground">
            PNG, JPG, GIF hasta 10MB · Opcional
          </p>
        </div>
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

// ─── PriceFields ──────────────────────────────────────────────────────────────

function PriceFields({ v, onUpdate, showStock = true, stockMode }) {
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
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <FieldLabel>Precio venta</FieldLabel>
          <Input
            type="number"
            value={v.price ?? ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(v.id, "price", parseFloat(e.target.value) || 0)
            }
          />
        </div>
        <div>
          <FieldLabel>Precio anterior</FieldLabel>
          <Input
            type="number"
            value={v.old_price ?? ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(v.id, "old_price", parseFloat(e.target.value) || 0)
            }
          />
        </div>
        {showStock && (
          <div>
            <FieldLabel>Stock</FieldLabel>
            {stockMode === "switch" ? (
              <div className="flex items-center gap-2 mt-1">
                <Switch
                  checked={Number(v.stock) > 0}
                  onCheckedChange={(c) => onUpdate(v.id, "stock", c ? 1 : 0)}
                />
                <span className="text-xs text-muted-foreground">
                  {Number(v.stock) > 0 ? "En stock" : "Agotado"}
                </span>
              </div>
            ) : (
              <Input
                type="number"
                value={v.stock ?? ""}
                placeholder="0"
                onChange={(e) =>
                  onUpdate(v.id, "stock", parseInt(e.target.value) || 0)
                }
              />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Costo / inversión</FieldLabel>
          <Input
            type="number"
            value={v.priceCompra ?? ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(v.id, "priceCompra", parseFloat(e.target.value) || 0)
            }
          />
        </div>
        <div>
          <FieldLabel>Embalaje</FieldLabel>
          <Input
            type="number"
            value={v.embalaje ?? ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(v.id, "embalaje", parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      {margin && (
        <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <Info size={11} className="shrink-0" />
          Margen: <span className="font-medium">{margin.m}%</span> · ganás $
          {margin.gain} por unidad
          {Number(v.embalaje) > 0 && (
            <span className="text-blue-400 ml-1">(c/embalaje)</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── QuantityDiscounts — completamente opcional, oculto hasta que lo abra ─────

const QD_TYPES = [
  { value: "quantity", label: "Precio x u." },
  { value: "percentage", label: "Porcentaje %" },
  { value: "fixed", label: "Precio fijo" },
];

function QuantityDiscounts({ variantId, productId, discounts = [], onChange }) {
  // Solo se abre si ya tiene tramos guardados, o si el usuario lo pide
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
      {/* Trigger compacto — no ocupa espacio si está cerrado */}
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
          <p className="text-[11px] text-muted-foreground bg-secondary/20 rounded-lg px-3 py-2">
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

// ─── VariantRow — expandible, compacto en cerrado ─────────────────────────────

function VariantRow({
  v,
  onUpdate,
  onRemove,
  variantImageBlobs,
  setVariantImageBlobs,
  isDefault = false,
}) {
  const { webshop } = useContext(ThemeContext);
  const [expanded, setExpanded] = useState(false);

  const colorHex = variantColorDot(v.attributes);
  const localBlob = variantImageBlobs?.get(v.id) ?? null;

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
  const stockMode = webshop?.store?.stocks ? "number" : "switch";

  const stockBadge = isDefault
    ? { label: "principal", cls: "bg-primary/10 text-primary" }
    : !v.visible
      ? { label: "oculta", cls: "bg-secondary text-muted-foreground" }
      : totalStock === 0 || v.agotado
        ? { label: "sin stock", cls: "bg-amber-50 text-amber-700" }
        : { label: "activa", cls: "bg-green-50 text-green-700" };

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

  const handlePriceUpdate = (id, fieldOrObj, value) => {
    if (typeof fieldOrObj === "object") onUpdate(id, fieldOrObj);
    else onUpdate(id, { [fieldOrObj]: value });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Cabecera */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex items-center gap-2.5">
          {/* Thumbnail 36x36 */}
          <div className="w-9 h-9 rounded-lg bg-secondary/60 border border-border shrink-0 overflow-hidden flex items-center justify-center">
            {thumbnailSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailSrc}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : colorHex ? (
              <span
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ background: colorHex }}
              />
            ) : (
              <ImageIcon size={13} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {variantLabel(v.attributes)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">
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
                  <span className="text-[10px] text-green-600">📷</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3 bg-secondary/5">
          {/* Imagen + precio en grid */}
          <div className="grid md:grid-cols-2 gap-3">
            <ImageUploader
              currentImage={v.image}
              localBlob={localBlob}
              onFileSelect={handleFileSelect}
              onRemove={handleRemoveImage}
            />
            <PriceFields
              v={v}
              onUpdate={handlePriceUpdate}
              showStock
              stockMode={stockMode}
            />
          </div>

          {/* Descuentos: siempre disponible pero colapsado */}
          <div className="border-t border-border/60 pt-2">
            <QuantityDiscounts
              variantId={v.id}
              productId={v.product_id}
              discounts={v.quantity_discounts ?? []}
              onChange={(qd) => onUpdate(v.id, { quantity_discounts: qd })}
            />
          </div>

          {!isDefault && (
            <button
              type="button"
              onClick={() => onRemove(v.id)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive border border-destructive/20 rounded-lg py-1.5 hover:bg-destructive/5 transition-colors"
            >
              <X size={11} /> Eliminar variante
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VariantsManager ──────────────────────────────────────────────────────────

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

  const updateDefault = (fieldOrObj, value) => {
    const patch =
      typeof fieldOrObj === "object" ? fieldOrObj : { [fieldOrObj]: value };
    onChange(
      ensureDefault(
        variants.map((v) =>
          v.attributes?.es_default === true || v.default_variant === true
            ? { ...v, ...patch }
            : v,
        ),
      ),
    );
  };

  const updateVariant = (id, fieldOrObj, value) => {
    const patch =
      typeof fieldOrObj === "object" ? fieldOrObj : { [fieldOrObj]: value };
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const defaultBlob = defaultVariant
    ? (variantImageBlobs?.get(defaultVariant.id) ?? null)
    : null;

  const handleDefaultFileSelect = (file) => {
    if (!defaultVariant) return;
    setVariantImageBlobs((m) => {
      const next = new Map(m);
      next.set(defaultVariant.id, file);
      return next;
    });
  };

  const handleDefaultRemoveImage = () => {
    if (!defaultVariant) return;
    setVariantImageBlobs((m) => {
      const next = new Map(m);
      next.delete(defaultVariant.id);
      return next;
    });
    updateDefault({
      image: null,
      _deleteImage: normalizeImage(defaultVariant.image),
    });
  };

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
        stock: inh?.stock ?? 0,
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
          images: [],
          ...(defaultVariant?.image
            ? { _deleteImage: defaultVariant.image }
            : {}),
        }
      : (defaultVariant ?? makeDefaultVariant());

    onChange([newDefault, ...updated]);
  };

  const addAttribute = () => {
    const key = newAttrKey.trim().toLowerCase();
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
    if (attrMap[key].values.some((v) => v.hex === colorObj.hex)) return;
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

  // ── MODO SIMPLE ───────────────────────────────────────────────────────────────
  if (!multiMode) {
    return (
      <div className="space-y-3">
        <ImageUploader
          currentImage={defaultVariant?.image ?? null}
          localBlob={defaultBlob}
          onFileSelect={handleDefaultFileSelect}
          onRemove={handleDefaultRemoveImage}
        />

        <PriceFields
          v={defaultVariant ?? makeDefaultVariant()}
          onUpdate={(id, fieldOrObj, value) => {
            const patch =
              typeof fieldOrObj === "object"
                ? fieldOrObj
                : { [fieldOrObj]: value };
            updateDefault(patch);
          }}
          showStock
          stockMode={stockMode}
        />

        {/* QD colapsado por defecto en modo simple */}
        <div className="border-t border-border/60 pt-1">
          <QuantityDiscounts
            variantId={defaultVariant?.id}
            productId={defaultVariant?.product_id}
            discounts={defaultVariant?.quantity_discounts ?? []}
            onChange={(qd) => updateDefault({ quantity_discounts: qd })}
          />
        </div>

        {/* Activar variantes */}
        <div className="flex items-center justify-between px-4 py-3 border border-dashed border-border rounded-xl mt-1">
          <div>
            <p className="text-sm font-medium text-foreground">
              ¿Tiene colores, tallas u otras opciones?
            </p>
            <p className="text-xs text-muted-foreground">
              Activa para gestionar cada combinación por separado
            </p>
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

  return (
    <div className="space-y-3">
      {/* Stats — solo cuando hay variantes reales */}
      {realVariants.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Package, val: totalVariants, label: "variantes" },
            { icon: BarChart2, val: totalStock, label: "unidades" },
            { icon: Tag, val: withStock, label: "con stock" },
          ].map(({ icon: Icon, val, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center px-3 py-2 border border-border rounded-xl bg-secondary/20"
            >
              <Icon size={13} className="text-muted-foreground mb-1" />
              <p className="text-base font-semibold text-foreground">{val}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Sección 1: Configurar opciones (attrMap) — colapsable ── */}
      <CollapsibleSection
        title="Opciones del producto"
        summary={
          Object.keys(attrMap).length > 0
            ? `${Object.keys(attrMap).length} opción${Object.keys(attrMap).length !== 1 ? "es" : ""}`
            : "sin configurar"
        }
        accent={
          Object.keys(attrMap).length > 0
            ? "bg-primary/10 text-primary"
            : "bg-amber-50 text-amber-700"
        }
        defaultOpen={Object.keys(attrMap).length === 0}
      >
        <p className="text-[11px] text-muted-foreground">
          Cada opción con sus valores genera automáticamente las variantes
          combinadas.
        </p>

        {Object.entries(attrMap).map(([key, { type, values }]) => (
          <div
            key={key}
            className="border border-border rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">{key}</span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    type === "color"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {type === "color" ? (
                    <>
                      <Palette size={8} /> color
                    </>
                  ) : (
                    <>
                      <Type size={8} /> texto
                    </>
                  )}
                </span>
                {values.length === 0 && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    agrega valores →
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  className="text-[11px] border border-border rounded-lg px-2 py-1 bg-background text-foreground"
                  value={type}
                  onChange={(e) => changeAttrType(key, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="text">texto</option>
                  <option value="color">color</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAttribute(key)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-5">
              {values.map((val, idx) =>
                type === "color" ? (
                  <ColorPill
                    key={idx}
                    value={val}
                    onRemove={() => removeAttrValue(key, idx)}
                  />
                ) : (
                  <TextPill
                    key={idx}
                    value={val}
                    onRemove={() => removeAttrValue(key, idx)}
                  />
                ),
              )}
              {values.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  Sin valores aún
                </span>
              )}
            </div>

            {type === "color" ? (
              <ColorValueInput onAdd={(c) => addColorValue(key, c)} />
            ) : (
              <div className="flex gap-2">
                <Input
                  className="h-8 text-xs"
                  placeholder={`Agregar ${key}...`}
                  value={newAttrValues[key] ?? ""}
                  onChange={(e) =>
                    setNewAttrValues((p) => ({ ...p, [key]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTextValue(key);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTextValue(key)}
                  className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}

        {showAttrInput ? (
          <div className="flex gap-2">
            <Input
              placeholder="Nombre (ej: color, talla, sabor)"
              className="h-9 text-sm"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAttribute();
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={addAttribute}
              className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs shrink-0"
            >
              <Plus size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAttrInput(false);
                setNewAttrKey("");
              }}
              className="h-9 px-3 rounded-xl border border-border text-xs text-muted-foreground shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAttrInput(true)}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-xl py-2.5 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus size={12} /> Agregar opción
          </button>
        )}
      </CollapsibleSection>

      {/* ── Sección 2: Lista de variantes — colapsable ── */}
      {(defaultVariant || realVariants.length > 0) && (
        <CollapsibleSection
          title="Variantes"
          summary={`${totalVariants} ${totalVariants === 1 ? "variante" : "variantes"}`}
          accent="bg-secondary text-muted-foreground"
          defaultOpen
        >
          <div className="space-y-2">
            {defaultVariant && (
              <VariantRow
                key={defaultVariant.id}
                v={defaultVariant}
                onUpdate={updateVariant}
                onRemove={() => {}}
                variantImageBlobs={variantImageBlobs}
                setVariantImageBlobs={setVariantImageBlobs}
                isDefault
              />
            )}
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
                    embalaje: 0,
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

      {/* Desactivar multi */}
      {!showConfirmDisable ? (
        <div className="flex items-center justify-between px-4 py-2.5 border border-border rounded-xl">
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
        <div className="border border-destructive/30 rounded-xl p-4 space-y-3">
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
              className="flex-1 py-2 rounded-xl bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors"
            >
              Sí, desactivar
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDisable(false)}
              className="flex-1 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-secondary/40 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

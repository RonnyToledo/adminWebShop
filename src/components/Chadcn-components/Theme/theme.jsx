"use client";
import React, { useState, useContext, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Grid3X3,
  Minimize2,
  Palette,
  Wand2,
  LayoutGrid,
  Rows,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { FromData } from "@/components/globalFunction/fromData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PlanGuard from "../Planes/PlanGuard";
import { cn } from "@/lib/utils";
import { TbCategoryMinus, TbCategoryPlus } from "react-icons/tb";
/* ─── Defaults ──────────────────────────────────────────────── */

const DEFAULT_COLOR = "oklch(27.8% 0.033 256.848)"; // Grafito

const colors = [
  { value: DEFAULT_COLOR, label: "Grafito" },
  { value: "oklch(45.5% 0.188 13.697)", label: "Rojo" },
  { value: "oklch(45.2% 0.211 324.591)", label: "Rosa" },
  { value: "oklch(43.8% 0.218 303.724)", label: "Violeta" },
  { value: "oklch(39.8% 0.195 277.366)", label: "Morado" },
  { value: "oklch(42.4% 0.199 265.638)", label: "Azul oscuro" },
  { value: "oklch(45% 0.085 224.283)", label: "Celeste" },
  { value: "oklch(43.2% 0.095 166.913)", label: "Verde" },
  { value: "oklch(47.6% 0.114 61.907)", label: "Ámbar" },
  { value: "oklch(44.4% 0.177 26.899)", label: "Naranja" },
];

const DEFAULT_STORE = {
  grid: true,
  square: false,
  horizontal: false,
  minimalista: false,
  colorAutomatic: false,
  color: DEFAULT_COLOR,
  catalogLayout: "classic",
  view_news: true, // 👈 nuevo
};

/* ─── ThemeSection: wrapper de card reutilizable ───────────────
   Acepta un `action` opcional (ej. el switch de color automático)
   que se alinea a la derecha del header en desktop y debajo del
   título en pantallas muy angostas. */

function ThemeSection({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  action,
  children,
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("p-2 rounded-lg shrink-0", iconBg)}>
              {React.cloneElement(icon, {
                className: cn("w-5 h-5", iconColor),
              })}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {action && <div className="shrink-0 sm:pt-0.5">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

/* ─── OptionPicker: par de opciones tipo card ──────────────────
   Genérico respecto al tipo de valor (boolean o string), a
   diferencia del RadioPair anterior que solo servía para 0/1. */

function OptionPicker({ value, onChange, options, columns = 2 }) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
      )}
    >
      {options.map(({ id, val, label, sublabel, icon }) => {
        const isSelected = value === val;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(val)}
            aria-pressed={isSelected}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/30 hover:bg-secondary/50",
            )}
          >
            {icon && (
              <div
                className={cn(
                  "shrink-0 grid place-items-center w-9 h-9 rounded-lg",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium leading-none",
                  isSelected && "text-primary",
                )}
              >
                {label}
              </p>
              {sublabel && (
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  {sublabel}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── ToggleSwitch: switch minimalista para colorAutomatic ─────
   No depende de un componente Switch de shadcn (que puede no
   estar instalado); es un botón accesible con role="switch". */

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-secondary border border-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

/* ─── Componente principal ─────────────────────────────────── */

export default function Theme({ ThemeContext, initialData }) {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("Theme must be used within ThemeProvider");
  const { webshop, setWebshop } = context;

  const [store, setStore] = useState({ ...DEFAULT_STORE, ...webshop.store });

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);

  useEffect(() => {
    setStore({ ...DEFAULT_STORE, ...webshop.store });
  }, [webshop.store]);

  // grid y horizontal son mutuamente excluyentes. Antes esto se
  // resolvía con dos useEffect encadenados que también se disparaban
  // al sincronizar con webshop.store (re-renders de más si el dato
  // llegaba inconsistente). Ahora se resuelve directo en el
  // onChange del OptionPicker de "Distribución", como un radio real.

  const effectiveColor = store?.color || DEFAULT_COLOR;
  const selectedColor = colors.find((c) => c.value === effectiveColor);
  const isMasonry = store?.catalogLayout === "masonry";

  return (
    <PlanGuard feature="theme">
      <main className="container mx-auto my-6 px-4 sm:px-6 lg:px-8 space-y-5">
        <FromData store={store} ThemeContext={ThemeContext}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                Apariencia
              </h1>
              <p className="text-sm text-muted-foreground">
                Personaliza cómo se ve tu tienda para los clientes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Columna izquierda — controles */}
            <div className="lg:col-span-2 space-y-4">
              {/* Color */}
              <ThemeSection
                icon={<Palette />}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="Color principal"
                description={
                  store?.colorAutomatic
                    ? "Se detecta automáticamente según tus productos"
                    : `Define el color de botones, badges y acentos${
                        selectedColor ? ` · ${selectedColor.label}` : ""
                      }`
                }
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Automático
                    </span>
                    <ToggleSwitch
                      checked={!!store?.colorAutomatic}
                      onChange={(v) =>
                        setStore({ ...store, colorAutomatic: v })
                      }
                      label="Detectar color automáticamente"
                    />
                  </div>
                }
              >
                <div
                  className={cn(
                    "transition-opacity",
                    store?.colorAutomatic && "opacity-40 pointer-events-none",
                  )}
                >
                  {store?.colorAutomatic && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
                      <Wand2 className="w-3.5 h-3.5 shrink-0" />
                      Tomamos el color dominante de las fotos de tus productos.
                      Desactivá esto para elegir uno manualmente.
                    </div>
                  )}
                  {/* Contenedor relativo para el fade de scroll */}
                  <div className="relative">
                    <ScrollArea className="w-full pb-3">
                      <div className="flex gap-3 p-1">
                        {colors.map((c) => {
                          const isSelected = c.value === effectiveColor;
                          return (
                            <button
                              key={c.value}
                              type="button"
                              title={c.label}
                              disabled={store?.colorAutomatic}
                              onClick={() =>
                                setStore({ ...store, color: c.value })
                              }
                              className={cn(
                                "shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all",
                                isSelected
                                  ? "border-foreground scale-105"
                                  : "border-transparent hover:border-border",
                              )}
                            >
                              <div
                                className="w-10 h-10 rounded-lg"
                                style={{ backgroundColor: c.value }}
                              />
                              <span className="text-[10px] text-muted-foreground w-12 text-center leading-tight">
                                {c.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    {/* Fade a la derecha: señal visual de que hay más
                        swatches, sin depender de que se note el scrollbar */}
                    <div
                      className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 bg-linear-to-l from-card to-transparent sm:hidden"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </ThemeSection>

              {/* Diseño de catálogo */}
              <ThemeSection
                icon={<LayoutGrid />}
                iconBg="bg-sky-100"
                iconColor="text-sky-600"
                title="Diseño de catálogo"
                description="Cómo se organizan los productos en la página principal"
              >
                <OptionPicker
                  value={store?.catalogLayout || "classic"}
                  onChange={(v) => setStore({ ...store, catalogLayout: v })}
                  options={[
                    {
                      id: "layout-classic",
                      val: "classic",
                      label: "Clásico",
                      sublabel: "Agrupado por categoría",
                      icon: <Rows className="w-4 h-4" />,
                    },
                    {
                      id: "layout-masonry",
                      val: "masonry",
                      label: "Mosaico",
                      sublabel: "Grid continuo, sin cortes",
                      icon: <Grid3X3 className="w-4 h-4" />,
                    },
                  ]}
                />
              </ThemeSection>

              {/* Estilo */}
              <ThemeSection
                icon={<Minimize2 />}
                iconBg="bg-rose-100"
                iconColor="text-rose-600"
                title="Estilo de tarjeta"
                description="Nivel de detalle visible en cada producto"
              >
                <OptionPicker
                  value={!!store?.minimalista}
                  onChange={(v) => setStore({ ...store, minimalista: v })}
                  options={[
                    {
                      id: "style-detail",
                      val: false,
                      label: "Detallado",
                      sublabel: "Precio, botón y descripción",
                    },
                    {
                      id: "style-minimal",
                      val: true,
                      label: "Minimalista",
                      sublabel: "Solo nombre y precio",
                    },
                  ]}
                />
              </ThemeSection>
              {/* Novedades */}
              <ThemeSection
                icon={store?.view_news ? <Eye /> : <EyeOff />}
                iconBg={store?.view_news ? "bg-amber-100" : "bg-secondary"}
                iconColor={
                  store?.view_news ? "text-amber-600" : "text-muted-foreground"
                }
                title="Sección de novedades"
                description={
                  store?.view_news
                    ? "Carrusel de marcas o categorías destacadas, arriba del catálogo"
                    : "Oculta — el catálogo arranca directo, sin el carrusel superior"
                }
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {store?.view_news ? "Visible" : "Oculta"}
                    </span>
                    <ToggleSwitch
                      checked={!!store?.view_news}
                      onChange={(v) => setStore({ ...store, view_news: v })}
                      label="Mostrar sección de novedades"
                    />
                  </div>
                }
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 transition-opacity",
                    !store?.view_news && "opacity-60",
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  {store?.view_news
                    ? "Se muestra un carrusel horizontal debajo del banner de bienvenida."
                    : "Activá esto si querés destacar marcas o categorías arriba del catálogo."}
                </div>
              </ThemeSection>
              <ThemeSection
                icon={
                  store?.category_hidden ? (
                    <TbCategoryPlus />
                  ) : (
                    <TbCategoryMinus />
                  )
                }
                iconBg={
                  store?.category_hidden ? "bg-amber-100" : "bg-secondary"
                }
                iconColor={
                  store?.category_hidden
                    ? "text-amber-600"
                    : "text-muted-foreground"
                }
                title="Panel de Categorias"
                description={
                  store?.category_hidden
                    ? "La barra de Cateogorias aparece automaticamente"
                    : "La barra de categorias siempre esta visible"
                }
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {store?.category_hidden ? "Visible" : "Automatica"}
                    </span>
                    <ToggleSwitch
                      checked={!!store?.category_hidden}
                      onChange={(v) =>
                        setStore({ ...store, category_hidden: v })
                      }
                      label="Mostrar panel de categorías"
                    />
                  </div>
                }
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 transition-opacity",
                    !store?.category_hidden && "opacity-60",
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  {store?.category_hidden
                    ? "Al descativar la barra siempre estara visible en el inicio"
                    : "Al activar la barra solo aparecera cuando se haga scroll sobre los productos"}
                </div>
              </ThemeSection>
            </div>

            {/* Columna derecha — preview */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-8">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: effectiveColor }}
                    />
                    <CardTitle className="text-base">Vista previa</CardTitle>
                  </div>
                  <CardDescription>
                    Así verán tu tienda los clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Banner simulado */}
                  <div
                    className="w-full h-14 rounded-lg opacity-20"
                    style={{ backgroundColor: effectiveColor }}
                  />
                  {/* Novedades simulado */}
                  {store?.view_news && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles
                          className="w-3 h-3"
                          style={{ color: effectiveColor }}
                        />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Novedades
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="w-9 h-9 rounded-full shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {store?.category_hidden && (
                    <div className="space-y-1.5 border-b p-1">
                      <div className="flex gap-2 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="w-16 h-4 rounded-lg shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {isMasonry ? (
                    <MasonryPreview
                      color={effectiveColor}
                      minimalista={store?.minimalista}
                    />
                  ) : (
                    <ClassicPreview
                      color={effectiveColor}
                      minimalista={store?.minimalista}
                    />
                  )}

                  {/* Resumen de config activa */}
                  <div className="pt-2 border-t space-y-1">
                    {[
                      {
                        label: "Color",
                        val: store?.colorAutomatic
                          ? "Automático"
                          : selectedColor?.label || "—",
                      },
                      {
                        label: "Catálogo",
                        val: isMasonry ? "Mosaico" : "Clásico",
                      },

                      {
                        label: "Estilo",
                        val: store?.minimalista ? "Minimalista" : "Detallado",
                      },
                      {
                        label: "Novedades",
                        val: store?.view_news ? "Visible" : "Oculta",
                      },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </FromData>
      </main>
    </PlanGuard>
  );
}

/* ─── Previews ──────────────────────────────────────────────── */

function ClassicPreview({ color, minimalista }) {
  return (
    <div className={cn("grid gap-2", "grid-cols-2")}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "grid bg-background rounded-lg border p-2 gap-2",
            "grid-cols-1",
          )}
        >
          <Skeleton className={cn("w-full rounded-md", "aspect-[4/3]")} />
          <div className="space-y-1.5">
            <Skeleton className="w-full h-3 rounded" />
            <Skeleton className="w-2/3 h-2.5 rounded" />
            {!minimalista && (
              <>
                <Skeleton className="w-1/2 h-2.5 rounded" />
                <div className="flex justify-between items-center pt-1">
                  <Skeleton className="w-1/3 h-3 rounded" />
                  <div
                    className="w-6 h-4 rounded"
                    style={{ backgroundColor: color, opacity: 0.7 }}
                  />
                </div>
              </>
            )}
            {minimalista && (
              <div
                className="w-1/3 h-3 rounded mt-1"
                style={{ backgroundColor: color, opacity: 0.5 }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MasonryPreview({ color, minimalista }) {
  // Alturas variadas para simular el desbalance natural del masonry.
  const heights = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[3/4]",
  ];
  return (
    <div className="flex gap-2">
      {[0, 1].map((col) => (
        <div key={col} className="flex-1 flex flex-col gap-2">
          {[col, col + 2].map((i) => (
            <div
              key={i}
              className="relative rounded-lg overflow-hidden border bg-background"
            >
              <Skeleton className={cn("w-full", heights[i])} />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1 right-1 text-[8px] px-1.5 py-0.5 rounded-full text-white/90 bg-black/40">
                Categoría
              </span>
              {!minimalista && (
                <div className="p-1.5 space-y-1">
                  <Skeleton className="w-full h-2 rounded" />
                  <div
                    className="w-1/3 h-2 rounded"
                    style={{ backgroundColor: color, opacity: 0.5 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

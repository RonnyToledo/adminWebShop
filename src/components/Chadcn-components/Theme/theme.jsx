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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Settings,
  Grid3X3,
  Square,
  RectangleVerticalIcon as Rectangle,
  Minimize2,
  Palette,
} from "lucide-react";
import { FromData } from "@/components/globalFunction/fromData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PlanGuard from "../Planes/PlanGuard";

// Paleta de colores con etiquetas legibles
const colors = [
  { value: "oklch(27.8% 0.033 256.848)", label: "Grafito" },
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

// Sección de configuración reutilizable
function ThemeSection({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {React.cloneElement(icon, { className: `w-5 h-5 ${iconColor}` })}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// Par de opciones RadioGroup
function RadioPair({ value, onChange, accentHover, options }) {
  return (
    <RadioGroup
      value={String(Number(value))}
      onValueChange={(v) => onChange(v === "1")}
      className="grid grid-cols-2 gap-3"
    >
      {options.map(({ id, val, label, sublabel }) => {
        const isSelected = String(Number(value)) === String(val);
        return (
          <label
            key={id}
            htmlFor={id}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
              ${
                isSelected
                  ? `${accentHover} border-current`
                  : `border-border hover:${accentHover} hover:border-current`
              }`}
          >
            <RadioGroupItem value={String(val)} id={id} />
            <div>
              <p className="text-sm font-medium leading-none">{label}</p>
              {sublabel && (
                <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
              )}
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}

export default function Theme({ ThemeContext }) {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("Theme must be used within ThemeProvider");
  const { webshop } = context;

  const [store, setStore] = useState(
    webshop.store || {
      grid: true,
      square: false,
      horizontal: false,
      minimalista: false,
    },
  );

  useEffect(() => {
    setStore(webshop.store);
  }, [webshop.store]);

  // grid y horizontal son mutuamente excluyentes
  useEffect(() => {
    if (store?.grid) setStore((s) => ({ ...s, horizontal: false }));
  }, [store?.grid]);

  useEffect(() => {
    if (store?.horizontal) setStore((s) => ({ ...s, grid: false }));
  }, [store?.horizontal]);

  const selectedColor = colors.find((c) => c.value === store?.color);

  return (
    <PlanGuard feature="theme">
      <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <FromData store={store} ThemeContext={ThemeContext}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Apariencia
              </h1>
              <p className="text-sm text-muted-foreground">
                Personaliza cómo se ve tu tienda para los clientes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna izquierda — controles */}
            <div className="md:col-span-2 space-y-4">
              {/* Color */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        Color principal
                      </CardTitle>
                      <CardDescription>
                        Define el color de botones, badges y acentos
                        {selectedColor && (
                          <span className="ml-2 font-medium text-foreground">
                            · {selectedColor.label}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="w-full pb-3">
                    <div className="flex gap-3 p-1">
                      {colors.map((c) => {
                        const isSelected = c.value === store?.color;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            title={c.label}
                            onClick={() =>
                              setStore({ ...store, color: c.value })
                            }
                            className={`shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all
                            ${isSelected ? "border-foreground scale-105" : "border-transparent hover:border-border"}`}
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
                </CardContent>
              </Card>

              {/* Grid */}
              <ThemeSection
                icon={<Grid3X3 />}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                title="Columnas de productos"
                description="Cuántos productos se muestran por fila"
              >
                <RadioPair
                  value={store?.grid}
                  onChange={(v) => setStore({ ...store, grid: v })}
                  accentHover="bg-emerald-50 text-emerald-700 border-emerald-400"
                  options={[
                    {
                      id: "grid-1",
                      val: 0,
                      label: "1 columna",
                      sublabel: "Vista amplia",
                    },
                    {
                      id: "grid-2",
                      val: 1,
                      label: "2 columnas",
                      sublabel: "Vista compacta",
                    },
                  ]}
                />
              </ThemeSection>

              {/* Forma */}
              <ThemeSection
                icon={<Square />}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                title="Forma de imagen"
                description="Relación de aspecto de las fotos de producto"
              >
                <RadioPair
                  value={store?.square}
                  onChange={(v) => setStore({ ...store, square: v })}
                  accentHover="bg-purple-50 text-purple-700 border-purple-400"
                  options={[
                    {
                      id: "shape-rect",
                      val: 0,
                      label: "Rectangular",
                      sublabel: "Relación 4:3",
                    },
                    {
                      id: "shape-square",
                      val: 1,
                      label: "Cuadrado",
                      sublabel: "Relación 1:1",
                    },
                  ]}
                />
              </ThemeSection>

              {/* Orientación */}
              <ThemeSection
                icon={<Rectangle />}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                title="Orientación de tarjeta"
                description="Disposición de imagen y texto dentro de cada tarjeta"
              >
                <RadioPair
                  value={store?.horizontal}
                  onChange={(v) => setStore({ ...store, horizontal: v })}
                  accentHover="bg-orange-50 text-orange-700 border-orange-400"
                  options={[
                    {
                      id: "orient-vert",
                      val: 0,
                      label: "Vertical",
                      sublabel: "Imagen arriba",
                    },
                    {
                      id: "orient-horiz",
                      val: 1,
                      label: "Horizontal",
                      sublabel: "Imagen al lado",
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
                <RadioPair
                  value={store?.minimalista}
                  onChange={(v) => setStore({ ...store, minimalista: v })}
                  accentHover="bg-rose-50 text-rose-700 border-rose-400"
                  options={[
                    {
                      id: "style-detail",
                      val: 0,
                      label: "Detallado",
                      sublabel: "Precio, botón y descripción",
                    },
                    {
                      id: "style-minimal",
                      val: 1,
                      label: "Minimalista",
                      sublabel: "Solo nombre y precio",
                    },
                  ]}
                />
              </ThemeSection>
            </div>

            {/* Columna derecha — preview */}
            <div className="md:col-span-1">
              <Card className="sticky top-8">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: store?.color ?? "#888" }}
                    />
                    <CardTitle className="text-base">Vista previa</CardTitle>
                  </div>
                  <CardDescription>
                    Así verán tu tienda los clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Banner simulado con el color de la tienda */}
                  <div
                    className="w-full h-14 rounded-lg opacity-20"
                    style={{ backgroundColor: store?.color ?? "#888" }}
                  />

                  {/* Grid de productos */}
                  <div
                    className={`grid gap-2 ${store?.grid ? "grid-cols-2" : "grid-cols-1"}`}
                  >
                    {Array.from({ length: store?.grid ? 4 : 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`grid bg-background rounded-lg border p-2 gap-2 ${
                          store?.horizontal
                            ? "grid-cols-2 items-center"
                            : "grid-cols-1"
                        }`}
                      >
                        {/* Imagen */}
                        <Skeleton
                          className={`w-full rounded-md ${
                            store?.square ? "aspect-square" : "aspect-[4/3]"
                          }`}
                        />
                        {/* Texto */}
                        <div className="space-y-1.5">
                          <Skeleton className="w-full h-3 rounded" />
                          <Skeleton className="w-2/3 h-2.5 rounded" />
                          {!store?.minimalista && (
                            <>
                              <Skeleton className="w-1/2 h-2.5 rounded" />
                              <div className="flex justify-between items-center pt-1">
                                <Skeleton className="w-1/3 h-3 rounded" />
                                <div
                                  className="w-6 h-4 rounded"
                                  style={{
                                    backgroundColor: store?.color ?? "#888",
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                            </>
                          )}
                          {store?.minimalista && (
                            <div
                              className="w-1/3 h-3 rounded mt-1"
                              style={{
                                backgroundColor: store?.color ?? "#888",
                                opacity: 0.5,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen de config activa */}
                  <div className="pt-2 border-t space-y-1">
                    {[
                      { label: "Columnas", val: store?.grid ? "2" : "1" },
                      {
                        label: "Imagen",
                        val: store?.square ? "Cuadrado" : "Rectangular",
                      },
                      {
                        label: "Tarjeta",
                        val: store?.horizontal ? "Horizontal" : "Vertical",
                      },
                      {
                        label: "Estilo",
                        val: store?.minimalista ? "Minimalista" : "Detallado",
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

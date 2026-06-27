"use client";
import React, { useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CombosSelector({
  selected = [],
  currentProductId,
  allProducts = [],
  onChange,
}) {
  const [query, setQuery] = useState("");

  const available = allProducts.filter(
    (p) =>
      p.productId !== currentProductId &&
      !selected.includes(p.productId) &&
      p.visible &&
      p.title?.toLowerCase().includes(query.toLowerCase()),
  );

  const selectedProducts = allProducts.filter((p) =>
    selected.includes(p.productId),
  );

  const add = (productId) => {
    if (selected.length >= 4) return; // máximo 4 combos
    onChange([...selected, productId]);
    setQuery("");
  };

  const remove = (productId) =>
    onChange(selected.filter((id) => id !== productId));

  return (
    <div className="space-y-3">
      {/* Productos seleccionados */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          {selectedProducts.map((p) => {
            const variant =
              p.product_variants?.find((v) => v.default_variant) ??
              p.product_variants?.[0];
            return (
              <div
                key={p.productId}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-secondary/20"
              >
                {variant?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={variant.image}
                    alt={p.title}
                    className="w-9 h-9 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-border shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
                    img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {variant?.price?.toLocaleString("es-CU")} CUP
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.productId)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Buscador — solo si hay espacio para más */}
      {selected.length < 4 && (
        <div className="space-y-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8 text-sm"
              placeholder="Buscar producto para sugerir..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {query.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-52 overflow-y-auto">
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2.5">
                  Sin resultados
                </p>
              ) : (
                available.slice(0, 6).map((p) => {
                  const variant =
                    p.product_variants?.find((v) => v.default_variant) ??
                    p.product_variants?.[0];
                  return (
                    <button
                      key={p.productId}
                      type="button"
                      onClick={() => add(p.productId)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors text-left"
                    >
                      {variant?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={variant.image}
                          alt={p.title}
                          className="w-8 h-8 rounded-md object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-secondary border border-border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {variant?.price?.toLocaleString("es-CU")} CUP
                        </p>
                      </div>
                      <Plus size={13} className="text-primary shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {selected.length}/4 productos · Aparecen en la tienda como "Queda bien
        con..."
      </p>
    </div>
  );
}

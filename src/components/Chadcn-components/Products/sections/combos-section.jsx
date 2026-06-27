"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const MAX_COMBOS = 4;

export function CombosSection({
  selected,
  currentProductId,
  allProducts,
  onChange,
}) {
  const [query, setQuery] = useState("");

  const selectedProducts = allProducts.filter((p) =>
    selected.includes(p.productId),
  );
  const available = allProducts.filter(
    (p) =>
      p.productId !== currentProductId &&
      !selected.includes(p.productId) &&
      p.visible &&
      p.title.toLowerCase().includes(query.toLowerCase()),
  );

  const add = (id) => {
    if (selected.length >= MAX_COMBOS) return;
    onChange([...selected, id]);
    setQuery("");
  };

  const remove = (id) => onChange(selected.filter((x) => x !== id));

  return (
    <div className="space-y-3">
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          {selectedProducts.map((p) => {
            const variant =
              p.product_variants.find((v) => v.default_variant) ??
              p.product_variants[0];
            return (
              <div
                key={p.productId}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary border border-border shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
                  {variant?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={variant.image || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    "img"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    ${variant?.price.toLocaleString("es-CU")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.productId)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label={`Quitar ${p.title}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected.length < MAX_COMBOS && (
        <div className="space-y-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="h-10 pl-9 rounded-xl text-sm"
              placeholder="Buscar producto para sugerir..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {query.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-60 overflow-y-auto bg-background">
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-3">
                  Sin resultados
                </p>
              ) : (
                available.slice(0, 6).map((p) => {
                  const variant =
                    p.product_variants.find((v) => v.default_variant) ??
                    p.product_variants[0];
                  return (
                    <button
                      key={p.productId}
                      type="button"
                      onClick={() => add(p.productId)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-md bg-secondary border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          ${variant?.price.toLocaleString("es-CU")}
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
        {selected.length}/{MAX_COMBOS} productos sugeridos · aparecen como
        &quot;Queda bien con...&quot; en la tienda
      </p>
    </div>
  );
}

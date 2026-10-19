"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ImageOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Tabla de preview del catálogo a importar.
 *
 * Categoría y moneda NUNCA se resuelven por texto del archivo: siempre son
 * <Select> controlados por el usuario, porque la relación real en tu base es
 * por UUID y coincidir por nombre podría asignar la categoría equivocada.
 * `categoryHint` / `currencyHint` solo se muestran como texto de apoyo.
 */
export function ImportPreviewTable({
  rows,
  categories,
  currencies,
  onRowChange,
  onToggleRow,
  onToggleAll,
}) {
  const allSelected = rows.length > 0 && rows.every((r) => r.__selected);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="max-h-[50vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 sticky top-0 z-10">
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => onToggleAll(Boolean(v))}
                />
              </th>
              <th className="px-3 py-2 w-8"></th>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2 w-28">Precio</th>
              <th className="px-3 py-2 w-24">Stock</th>
              <th className="px-3 py-2 w-56">Categoría</th>
              <th className="px-3 py-2 w-56">Moneda</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasErrors = row.errors.length > 0;
              const missingCategory = !row.categoryId;

              return (
                <tr
                  key={row.__row}
                  className={`border-t border-border ${
                    hasErrors ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="p-2 align-top">
                    <Checkbox
                      checked={row.__selected}
                      onCheckedChange={(v) =>
                        onToggleRow(row.__row, Boolean(v))
                      }
                    />
                  </td>
                  <td className="p-2 align-top">
                    {hasErrors ? (
                      <AlertTriangle
                        size={15}
                        className="text-red-500"
                        title={row.errors.join(" ")}
                      />
                    ) : (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    )}
                  </td>

                  <td className="px-3 py-2 align-top">
                    <p className="font-medium text-foreground">
                      {row.title || (
                        <span className="text-red-500 italic">Sin nombre</span>
                      )}
                    </p>
                    {row.imageName && !row.imageUrl && (
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <ImageOff size={11} /> {row.imageName}
                      </p>
                    )}
                    {hasErrors && (
                      <p className="text-[11px] text-red-500 mt-0.5">
                        {row.errors.join(" ")}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-2 align-top">
                    <input
                      type="number"
                      value={row.price ?? ""}
                      onChange={(e) =>
                        onRowChange(row.__row, {
                          price:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </td>

                  <td className="px-3 py-2 align-top">
                    <input
                      type="number"
                      value={row.stock ?? ""}
                      onChange={(e) =>
                        onRowChange(row.__row, {
                          stock:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </td>

                  {/* Categoría — siempre selección manual */}
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={row.categoryId ? String(row.categoryId) : ""}
                      onValueChange={(value) =>
                        onRowChange(row.__row, { categoryId: value })
                      }
                    >
                      <SelectTrigger
                        className={`h-8 text-xs ${
                          missingCategory ? "border-amber-400" : ""
                        }`}
                      >
                        <SelectValue placeholder="Elegir categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre ?? c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {row.categoryHint && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Archivo: “{row.categoryHint}”
                      </p>
                    )}
                  </td>

                  {/* Moneda — siempre selección manual */}
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={row.currencyId ? String(row.currencyId) : ""}
                      onValueChange={(value) =>
                        onRowChange(row.__row, { currencyId: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Elegir moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre ?? c.codigo ?? c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {row.currencyHint && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Archivo: “{row.currencyHint}”
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ImportPreviewTable;

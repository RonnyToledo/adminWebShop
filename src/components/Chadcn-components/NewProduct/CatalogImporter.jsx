"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

import { ThemeContext } from "@/context/useContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  detectColumnMapping,
  buildImportRow,
  validateImportRow,
  matchEntityByHint,
  isRemoteImageUrl,
} from "@/lib/catalog-import/normalize";
import { ImportPreviewTable } from "./ImportPreviewTable";
import { useRouter } from "next/navigation";

const STEPS = {
  UPLOAD: "upload",
  PREVIEW: "preview",
  RESULT: "result",
};

export default function CatalogImporter() {
  const { webshop } = useContext(ThemeContext);
  const router = useRouter();

  const categories = webshop?.store?.categoria ?? [];
  const currencies = webshop?.store?.monedas ?? [];
  const defaultCurrencyId = currencies.find((c) => c.defecto)?.id ?? "";

  const [step, setStep] = useState(STEPS.UPLOAD);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [imageFiles, setImageFiles] = useState(new Map()); // filename(lower) -> File
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Valores para aplicar en lote a las filas seleccionadas
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkCurrency, setBulkCurrency] = useState(defaultCurrencyId);

  const selectedRows = useMemo(() => rows.filter((r) => r.__selected), [rows]);
  const selectedCount = selectedRows.length;

  const validCount = useMemo(
    () =>
      rows.filter((r) => r.__selected && r.errors.length === 0 && r.categoryId)
        .length,
    [rows],
  );

  // ── 4. Categoría/moneda "en común" entre lo seleccionado ───────────────
  // Si todas las filas seleccionadas comparten el mismo valor, se muestra
  // en el selector de aplicar-a-seleccionados; si son distintas, queda en
  // blanco (placeholder) para no sugerir un valor incorrecto.
  const commonCategory = useMemo(() => {
    if (selectedRows.length === 0) return "";
    const first = selectedRows[0].categoryId ?? "";
    return selectedRows.every((r) => (r.categoryId ?? "") === first)
      ? first
      : "";
  }, [selectedRows]);

  const commonCurrency = useMemo(() => {
    if (selectedRows.length === 0) return "";
    const first = selectedRows[0].currencyId ?? "";
    return selectedRows.every((r) => (r.currencyId ?? "") === first)
      ? first
      : "";
  }, [selectedRows]);

  useEffect(() => {
    setBulkCategory(commonCategory);
  }, [commonCategory]);

  useEffect(() => {
    setBulkCurrency(commonCurrency);
  }, [commonCurrency]);

  // ── 1. Leer archivo Excel/CSV ─────────────────────────────────────────
  async function handleCatalogFile(file) {
    if (!file) return;
    try {
      setLoading(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!json.length) {
        toast.error("El archivo no contiene datos.");
        return;
      }

      const headers = Object.keys(json[0]);
      const mapping = detectColumnMapping(headers);

      const builtRows = json.map((raw, i) => buildImportRow(raw, mapping, i));

      // ── 5. Resolver moneda automáticamente ────────────────────────────
      // Si el texto de la columna "moneda" coincide con una moneda real de
      // la tienda, se usa esa. Si no coincide con ninguna (o no hay columna),
      // se asigna la moneda por defecto de la tienda para TODAS las filas.
      // La categoría nunca se resuelve así — siempre queda en manual.
      const withCurrency = builtRows.map((row) => {
        const matched = matchEntityByHint(row.currencyHint, currencies, [
          "nombre",
          "codigo",
          "name",
        ]);
        const currencyId = matched
          ? String(matched.id)
          : defaultCurrencyId
            ? String(defaultCurrencyId)
            : null;
        return { ...row, currencyId };
      });

      setFileName(file.name);
      setRows(withCurrency);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo leer el archivo. Verifica el formato.");
    } finally {
      setLoading(false);
    }
  }

  // ── 2. Seleccionar imágenes (opcional) ────────────────────────────────
  function handleImageFiles(fileList) {
    const files = Array.from(fileList ?? []);
    const map = new Map(imageFiles);
    files.forEach((f) => map.set(f.name.toLowerCase(), f));
    setImageFiles(map);

    setRows((prev) =>
      prev.map((row) => {
        if (!row.imageName) return row;
        const match = map.get(row.imageName.toLowerCase());
        return match ? { ...row, imageFile: match } : row;
      }),
    );

    toast.success(`${files.length} imagen(es) cargada(s)`);
  }

  // ── 3. Edición de filas en el preview ─────────────────────────────────
  // CLAVE: cada edición vuelve a correr validateImportRow. Antes, al
  // corregir el precio, el error de la fila quedaba "congelado" desde la
  // carga inicial y por eso el producto nunca pasaba a "listo".
  function handleRowChange(rowId, patch) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.__row !== rowId) return r;
        const updated = { ...r, ...patch };
        return { ...updated, errors: validateImportRow(updated) };
      }),
    );
  }

  function handleToggleRow(rowId, checked) {
    setRows((prev) =>
      prev.map((r) => (r.__row === rowId ? { ...r, __selected: checked } : r)),
    );
  }

  function handleToggleAll(checked) {
    setRows((prev) => prev.map((r) => ({ ...r, __selected: checked })));
  }

  function applyBulkCategory() {
    if (!bulkCategory) {
      toast.error("Elegí una categoría para aplicar.");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.__selected ? { ...r, categoryId: bulkCategory } : r)),
    );
    toast.success(`Categoría aplicada a ${selectedCount} producto(s).`);
  }

  function applyBulkCurrency() {
    if (!bulkCurrency) return;
    setRows((prev) =>
      prev.map((r) => (r.__selected ? { ...r, currencyId: bulkCurrency } : r)),
    );
    toast.success(`Moneda aplicada a ${selectedCount} producto(s).`);
  }

  // ── 4. Subir imágenes pendientes y construir payload final ────────────
  async function buildPayload() {
    const usable = rows.filter(
      (r) => r.__selected && r.errors.length === 0 && r.categoryId,
    );

    const pending = usable.filter(
      (r) =>
        (r.imageFile || isRemoteImageUrl(r.imageUrl)) &&
        (!r.imageUrl || isRemoteImageUrl(r.imageUrl)),
    );
    for (let i = 0; i < pending.length; i += 5) {
      const batch = pending.slice(i, i + 5);
      await Promise.all(
        batch.map(async (row) => {
          try {
            const form = new FormData();
            if (row.imageFile) form.append("file", row.imageFile);
            else form.append("url", row.imageUrl);
            const { data } = await axios.post(
              `/api/tienda/${webshop.store.sitioweb}/import/upload-image`,
              form,
              { withCredentials: true },
            );
            row.imageUrl = data?.secure_url ?? null;
          } catch (err) {
            console.error("Error subiendo imagen:", row.imageName, err);
          }
        }),
      );
    }

    return usable.map((row) => ({
      title: row.title,
      caja: row.categoryId,
      default_moneda: row.currencyId || defaultCurrencyId,
      venta: true,
      visible: true,
      span: false,
      descripcion: row.description ?? "",
      caracteristicas: [],
      info_sections: [],
      combos: [],
      product_variants: [
        {
          label: "",
          attributes: {},
          price: row.price,
          old_price: 0,
          stock: row.stock ?? 1,
          image: row.imageUrl ?? null,
          default_variant: true,
        },
      ],
    }));
  }

  // ── 5. Enviar a la API de importación ──────────────────────────────────
  async function handleImport() {
    if (!webshop?.store?.sitioweb || !webshop?.store?.UUID) {
      toast.error("Configuración de tienda incompleta.");
      return;
    }
    if (validCount === 0) {
      toast.error("No hay productos válidos para importar.");
      return;
    }

    setSubmitting(true);
    try {
      const products = await buildPayload();

      const { data } = await axios.post(
        `/api/tienda/${webshop.store.sitioweb}/import`,
        { storeId: webshop.store.UUID, products },
        { withCredentials: true },
      );

      setResult(data);
      setStep(STEPS.RESULT);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Error al importar el catálogo", {
        description: err?.response?.data?.message ?? err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(STEPS.UPLOAD);
    setFileName("");
    setRows([]);
    setImageFiles(new Map());
    setResult(null);
  }

  return (
    <div className="hidden lg:flex flex-col gap-4 bg-card border border-border rounded-2xl p-5 max-w-6xl mx-auto">
      {/* ── PASO 1: Upload ── */}
      {step === STEPS.UPLOAD && (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-14 cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleCatalogFile(e.target.files?.[0])}
          />
          {loading ? (
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          ) : (
            <Upload size={28} className="text-muted-foreground" />
          )}
          <p className="text-sm font-medium text-foreground">
            Arrastra o selecciona tu archivo
          </p>
          <p className="text-xs text-muted-foreground">.xlsx, .xls o .csv</p>
        </label>
      )}

      {/* ── PASO 2: Preview ── */}
      {step === STEPS.PREVIEW && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet size={16} />
            <span className="font-medium text-foreground">{fileName}</span>
            <span>· {rows.length} productos detectados</span>
          </div>

          {/* Aplicar en lote */}
          <div className="flex items-center justify-evenly gap-3 flex-wrap p-3 rounded-xl border border-border">
            <span className="text-xs font-medium text-foreground">
              Aplicar a {selectedCount} seleccionados:
            </span>
            <div className="flex items-center gap-2">
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="outline" onClick={applyBulkCategory}>
                <BadgeCheck />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={bulkCurrency} onValueChange={setBulkCurrency}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre ?? c.codigo ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="outline" onClick={applyBulkCurrency}>
                <BadgeCheck />
              </Button>
            </div>
          </div>

          <ImportPreviewTable
            rows={rows}
            categories={categories}
            currencies={currencies}
            onRowChange={handleRowChange}
            onToggleRow={handleToggleRow}
            onToggleAll={handleToggleAll}
          />

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {validCount} de {rows.length} listos para importar
              {validCount < selectedCount &&
                " · revisa filas sin categoría o con errores"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={submitting || validCount === 0}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <ArrowRight size={16} className="mr-2" />
                )}
                Importar {validCount} producto{validCount === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 3: Resultado ── */}
      {step === STEPS.RESULT && result && (
        <div className="space-y-4 text-center py-6">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <div>
            <p className="text-lg font-semibold text-foreground">
              Importación completada
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.created} producto{result.created === 1 ? "" : "s"} creado
              {result.created === 1 ? "" : "s"}
              {result.failed > 0 && ` · ${result.failed} con errores`}
            </p>
          </div>

          {result.errors?.length > 0 && (
            <div className="text-left max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1 max-h-48 overflow-auto">
              {result.errors.map((e, i) => (
                <p key={i}>
                  Fila {e.row} — {e.title || "(sin nombre)"}: {e.message}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" onClick={reset}>
              Importar otro archivo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

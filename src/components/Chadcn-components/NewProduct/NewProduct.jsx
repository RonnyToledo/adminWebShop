"use client";
import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { logoAdmin } from "@/utils/image";
import { toast } from "sonner";
import ProductEditForm from "../Products/product-edit-form";
import Image from "next/image";
import { ThemeContext } from "@/context/useContext";
import { makeDefaultVariant } from "../Products/VariantsManager";
import { useRouter } from "next/navigation";
import { hasChanged } from "@/utils/hasChanges";

// Solo campos que ProductEditForm/VariantsManager realmente escriben
// price/stock/priceCompra/embalaje NO van aquí — viven en product_variants[0]
const getInitialProducts = (defaultCurrencyId) => ({
  venta: true,
  span: false,
  title: "",
  descripcion: "",
  caracteristicas: [],
  visible: true,
  publish_at: null,
  default_moneda: defaultCurrencyId ?? null,
  product_variants: [makeDefaultVariant(0, 0, 1)], // ← con variante desde el inicio
  combos: [],
});

export default function NewProduct({ initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const router = useRouter();
  const currencies =
    webshop?.store?.monedas?.length > 0
      ? webshop.store.monedas
      : (initialData?.store?.monedas ?? []);
  const defaultCurrencyId = currencies.find((currency) => currency.defecto)?.id;
  const categories = webshop?.store?.categoria?.length
    ? webshop.store.categoria
    : webshop?.store?.categorias?.length
      ? webshop.store.categorias
      : initialData?.store?.categoria?.length
        ? initialData.store.categoria
        : (initialData?.store?.categorias ?? []);

  const initialProductsRef = useRef(null);
  const [products, setProducts] = useState(() => {
    const initial = getInitialProducts(defaultCurrencyId);
    initialProductsRef.current = initial;
    return initial;
  });
  const [variantImageBlobs, setVariantImageBlobs] = useState(new Map());
  const [downloading, setdownloading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!initialData) return;
    const initialCategories =
      initialData.store?.categoria ?? initialData.store?.categorias ?? [];
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: {
        ...previous.store,
        ...(initialData.store ?? {}),
        categoria:
          initialCategories.length > 0
            ? initialCategories
            : (previous.store?.categoria ?? []),
      },
    }));
  }, [initialData, setWebshop]);
  function getLocalISOString(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 19);
  }

  const handleCreateCategory = async (name) => {
    if (downloading) return;
    const storeId = webshop?.store?.UUID;
    const storeName = webshop?.store?.sitioweb;
    if (!storeId || !storeName) {
      toast.error("Configuración incompleta", {
        description: "No se pudo identificar la tienda.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `/api/tienda/${storeName}/categoria`,
        {
          name,
          storeId,
          order: categories.length,
        },
        { withCredentials: true },
      );
      const created = response?.data?.data;
      if (!created?.id) throw new Error("La categoría no fue creada");

      setWebshop((previous) => ({
        ...previous,
        store: {
          ...previous.store,
          categoria: [...(previous.store?.categoria ?? []), created],
        },
      }));
      setProducts((previous) => ({ ...previous, caja: created.id }));
      toast.success("Categoría creada");
    } catch (error) {
      toast.error("No se pudo crear la categoría", {
        description:
          error?.response?.data?.message ?? error?.message ?? "Error al crear",
      });
      throw error;
    }
  };

  const handleSubmit = async (publishAtOverride) => {
    if (submitLock.current) return;
    const now = new Date();

    if (!webshop?.store?.sitioweb || !webshop?.store?.UUID) {
      toast.error("Configuración incompleta", {
        description: "Revisa los datos de la tienda.",
      });
      return;
    }
    if (!products?.title?.trim()) {
      toast.error("Sin título", {
        description: "El producto necesita un título.",
      });
      return;
    }
    if (!products?.caja) {
      toast.error("Sin categoría", {
        description: "Selecciona una categoría.",
      });
      return;
    }

    const productVariants = products.product_variants ?? [];

    // La variante default tiene price/stock/priceCompra/embalaje (y la imagen
    // principal del producto, ver comentario en el submit de más abajo)
    const defaultVariant = productVariants.find(
      (v) => v.attributes?.es_default === true || v.default_variant === true,
    );
    const invalidPrice = productVariants.some((v) => {
      const price = Number(v.price);
      return !Number.isFinite(price) || price < 0;
    });
    // Validar que al menos la variante default tenga precio
    if (
      !defaultVariant ||
      defaultVariant.price == null ||
      isNaN(defaultVariant.price) ||
      defaultVariant.price < 0 ||
      invalidPrice
    ) {
      toast.error("Precio inválido", {
        description: "El producto necesita un precio válido.",
      });
      return;
    }

    const formData = new FormData();

    // ── Campos del producto raíz ──────────────────────────────────────────
    formData.append("title", products.title ?? "");
    formData.append("visible", String(products.visible ?? true));
    formData.append(
      "publish_at",
      publishAtOverride ?? products.publish_at ?? "",
    );
    formData.append("UID", webshop.store.UUID);
    formData.append(
      "default_moneda",
      String(products.default_moneda ?? defaultCurrencyId ?? ""),
    );
    formData.append("order", "10000");
    formData.append("caja", String(products.caja ?? ""));
    formData.append("venta", String(products.venta ?? false));
    formData.append("descripcion", String(products.descripcion ?? ""));
    formData.append("span", String(products.span ?? false));
    formData.append(
      "caracteristicas",
      JSON.stringify(products.caracteristicas ?? []),
    );
    formData.append(
      "info_sections",
      JSON.stringify(products.info_sections ?? []),
    );
    formData.append("creado", getLocalISOString(now));

    // ── Variantes — limpiar campos internos de UI ─────────────────────────
    // La imagen principal del producto sale de la variante default: si ya
    // trae una URL persistida se va tal cual dentro de "variants"; si es un
    // blob nuevo, viaja en variantImageBlobs (abajo) y el backend la sube
    // con UploadNewImage y sincroniza Products.image automáticamente.
    const cleanVariants = productVariants.map(
      ({ _localPreview, _deleteImage, ...rest }) => rest,
    );
    formData.append("variants", JSON.stringify(cleanVariants));

    // ── Imágenes de variantes ─────────────────────────────────────────────
    const variantMeta = [];
    for (const [variantId, file] of variantImageBlobs.entries()) {
      const filename = `variant_${variantId}_${file.name}`;
      variantMeta.push({ variantId, filename });
      formData.append("variantImageFiles", file, filename);
    }
    formData.append("variantImageMeta", JSON.stringify(variantMeta));
    // ── Combos sugeridos ──────────────────────────────────────────────────────
    formData.append("combos", JSON.stringify(products.combos ?? []));
    submitLock.current = true;
    setdownloading(true);
    const postPromise = axios.post(
      `/api/tienda/${webshop.store.sitioweb}/products`,
      formData,
      { withCredentials: true },
    ).then((response) => {
      const created = response?.data?.data ?? response?.data;
      if (![200, 201].includes(response?.status) || !created) {
        throw new Error("El servidor no devolvió el producto creado.");
      }
      return response;
    });

    toast.promise(postPromise, {
      loading: "Creando producto...",
      success: (response) => {
        const raw = response?.data?.data ?? response?.data ?? null;
        const created = {
          ...raw,
          product_variants: raw.product_variants ?? raw.variants ?? [],
          combos: raw.combos ?? [],
        };
        setWebshop((prev) => ({
          ...prev,
          products: [...(prev?.products ?? []), created],
        }));
        router.refresh();

        const toastThumb = created.image || logoAdmin;
        const freshVariant = makeDefaultVariant(
          0,
          0,
          Number(!webshop?.store?.stocks),
        );
        const resetProducts = {
          ...getInitialProducts(defaultCurrencyId),
          product_variants: [freshVariant],
          caja: products.caja,
        };
        initialProductsRef.current = resetProducts;
        setProducts(resetProducts);
        setVariantImageBlobs(new Map());
        window.scrollTo({ top: 0, behavior: "smooth" });

        return {
          message: "Producto creado correctamente",
          description: (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-2.5">
              <Image
                src={toastThumb}
                alt={products.title}
                height={50}
                width={50}
                className="rounded-md object-cover"
              />
              <div>
                <p className="text-sm font-medium">{products.title}</p>
              </div>
            </div>
          ),
        };
      },
      error: (err) => ({
        message: "Error al crear producto",
        description: err?.response?.data?.message ?? err?.message,
      }),
    });
    postPromise.then(
      () => {
        submitLock.current = false;
        setdownloading(false);
      },
      () => {
        submitLock.current = false;
        setdownloading(false);
      },
    );
  };

  const selectedCurrencyId = products.default_moneda ?? defaultCurrencyId ?? "";

  return (
    <main className="mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8">
      <ProductEditForm
        product={{
          ...products,
          default_moneda: selectedCurrencyId,
        }}
        currencies={currencies}
        categories={categories}
        onProductChange={setProducts}
        hasChanges={
          hasMounted && hasChanged(products, initialProductsRef.current)
        }
        saving={downloading}
        variantImageBlobs={variantImageBlobs}
        setVariantImageBlobs={setVariantImageBlobs}
        onSave={handleSubmit}
        onCreateCategory={handleCreateCategory}
      />
    </main>
  );
}

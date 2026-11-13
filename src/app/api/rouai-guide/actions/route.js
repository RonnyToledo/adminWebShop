import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import {
  getRouAIGuideAccess,
  validateSameOrigin,
} from "@/lib/rouai-guide/server";
import { DestroyImage } from "@/components/globalFunction/imagesMove";
import { uploadRemoteImage } from "@/lib/remote-image-upload";

const ACTIONS = new Set([
  "create_category",
  "update_category",
  "create_product",
  "update_product",
  "update_store",
  "create_blog_post",
  "update_blog_post",
]);
const STORE_TEXT_FIELDS = new Set([
  "name",
  "parrrafo",
  "history",
  "cell",
  "email",
  "direccion",
]);

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function actionError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function uploadActionImage(imageUrl, context) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.trim() ||
    imageUrl.length > 2_048
  ) {
    throw actionError("La dirección de imagen no es válida.");
  }
  try {
    return await uploadRemoteImage(imageUrl);
  } catch (error) {
    console.error(`RouAI Guide ${context} image upload failed:`, error);
    throw actionError(
      "No se pudo cargar esa imagen. Comprueba que sea un enlace directo a una imagen pública e inténtalo de nuevo.",
      error.status ?? 400,
    );
  }
}

async function cleanupUploadedImage(imageUrl, context) {
  if (!imageUrl) return;
  try {
    await DestroyImage(imageUrl);
  } catch (error) {
    console.error(`RouAI Guide could not clean up an unused ${context} image:`, error);
  }
}

async function destroyReplacedImage(imageUrl, context) {
  if (!imageUrl) return;
  try {
    await DestroyImage(imageUrl);
  } catch (error) {
    console.error(`RouAI Guide could not remove the replaced ${context} image:`, error);
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function markdownToSafeBlogHtml(markdown) {
  const blocks = [];
  let paragraph = [];
  let listItems = [];
  let listType = null;
  let quote = [];
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${paragraph.map(formatInlineMarkdown).join(" ")}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        `<${listType}>${listItems.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</${listType}>`,
      );
      listItems = [];
      listType = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push(`<blockquote><p>${quote.map(formatInlineMarkdown).join(" ")}</p></blockquote>`);
      quote = [];
    }
  };
  const flushTextBlocks = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    if (code) {
      if (/^\s*```/.test(line)) {
        blocks.push(`<pre><code>${code.map(escapeHtml).join("\n")}</code></pre>`);
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }
    if (/^\s*```/.test(line)) {
      flushTextBlocks();
      code = [];
      continue;
    }
    if (!line.trim()) {
      flushTextBlocks();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushTextBlocks();
      const level = Math.min(4, heading[1].length);
      blocks.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const unorderedItem = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      flushParagraph();
      flushQuote();
      const nextListType = unorderedItem ? "ul" : "ol";
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      listItems.push((unorderedItem ?? orderedItem)[1]);
      continue;
    }
    const quotedLine = line.match(/^\s*>\s?(.*)$/);
    if (quotedLine) {
      flushParagraph();
      flushList();
      quote.push(quotedLine[1]);
      continue;
    }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      flushTextBlocks();
      blocks.push("<hr>");
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  if (code) blocks.push(`<pre><code>${code.map(escapeHtml).join("\n")}</code></pre>`);
  flushTextBlocks();
  return blocks.join("\n");
}

function createBlogSlug(title) {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120)
      .replace(/-+$/g, "") || "post"
  );
}

async function getUniqueBlogSlug(supabase, slugBase) {
  let slug = slugBase;
  let counter = 1;
  while (true) {
    const { data, error } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("RouAI Guide blog slug lookup failed:", error);
      throw actionError("No se pudo verificar la URL del post.", 500);
    }
    if (!data) return slug;
    slug = `${slugBase}-${counter}`;
    counter += 1;
  }
}

function normalizeProductInfoSections(value, description) {
  if (value !== undefined && (!Array.isArray(value) || value.length > 8)) {
    throw actionError("La información ampliada del producto no es válida.");
  }

  const sections = [];
  const labels = new Set();
  const sectionIds = new Set();
  for (const [index, section] of (value ?? []).entries()) {
    if (
      !isRecord(section) ||
      typeof section.label !== "string" ||
      typeof section.content !== "string"
    ) {
      throw actionError("Cada sección del producto necesita título y contenido.");
    }

    const label = section.label.trim();
    const content = section.content.trim();
    const normalizedLabel = label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
    if (
      !label ||
      label.length > 48 ||
      !content ||
      content.length > 500 ||
      labels.has(normalizedLabel)
    ) {
      throw actionError(
        "Revisa las secciones: los títulos deben ser únicos y el contenido breve.",
      );
    }
    labels.add(normalizedLabel);

    const sectionSlug = normalizedLabel
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id =
      normalizedLabel === "descripcion"
        ? "description"
        : `rouai-${sectionSlug || `info-${index + 1}`}`;
    if (sectionIds.has(id)) {
      throw actionError(
        "La ficha contiene títulos demasiado parecidos. Usa nombres de sección más claros.",
      );
    }
    sectionIds.add(id);
    sections.push({
      id,
      label,
      icon: id === "description" ? "FileText" : "Info",
      content,
      order: index,
    });
  }

  const descriptionIndex = sections.findIndex(
    (section) => section.id === "description",
  );
  if (descriptionIndex > 0) {
    sections.unshift(sections.splice(descriptionIndex, 1)[0]);
  }

  if (description && !sections.some((section) => section.id === "description")) {
    if (sections.length >= 8) {
      throw actionError(
        "La ficha completa supera el máximo de ocho secciones.",
      );
    }
    sections.unshift({
      id: "description",
      label: "Descripción",
      icon: "FileText",
      content: description,
      order: 0,
    });
  }

  return sections.map((section, order) => ({ ...section, order }));
}

async function getCategory(supabase, storeId, categoryId) {
  const { data, error } = await supabase
    .from("categorias")
    .select("id")
    .eq("id", categoryId)
    .eq("storeId", storeId)
    .maybeSingle();

  if (error) {
    console.error("RouAI Guide category ownership check failed:", error);
    throw actionError("No se pudo verificar la categoría.", 500);
  }
  if (!data) throw actionError("La categoría no pertenece a este negocio.", 400);
  return data;
}

async function runAction(access, action, payload) {
  const { supabase, store } = access;

  if (action === "create_category") {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    if (!name || name.length > 80) {
      throw actionError("El nombre de la categoría debe tener entre 1 y 80 caracteres.");
    }
    if (description.length > 500) {
      throw actionError("La descripción de la categoría no puede superar 500 caracteres.");
    }

    const { count, error: countError } = await supabase
      .from("categorias")
      .select("id", { count: "exact", head: true })
      .eq("storeId", store.UUID);
    if (countError) {
      console.error("RouAI Guide category order could not be determined:", countError);
      throw actionError("No se pudo verificar el orden de las categorías.", 500);
    }

    const uploadedImageUrl = Object.hasOwn(payload, "imageUrl")
      ? await uploadActionImage(payload.imageUrl, "category")
      : null;
    const { data, error } = await supabase
      .from("categorias")
      .insert({
        name,
        description,
        image: uploadedImageUrl,
        storeId: store.UUID,
        order: count ?? 0,
        subtienda: false,
        premium: false,
      })
      .select("id, name, description, image, storeId, order, subtienda, premium")
      .single();

    if (error) {
      await cleanupUploadedImage(uploadedImageUrl, "category");
      console.error("RouAI Guide could not create category:", error);
      throw actionError("No se pudo crear la categoría.", 500);
    }
    return { entity: data };
  }

  if (action === "update_category") {
    const categoryId = payload.categoryId;
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    if (!isUuid(categoryId)) throw actionError("Selecciona una categoría válida.");
    if (!name || name.length > 80) {
      throw actionError("El nombre de la categoría debe tener entre 1 y 80 caracteres.");
    }
    if (description.length > 500) {
      throw actionError("La descripción de la categoría no puede superar 500 caracteres.");
    }

    const { data: currentCategory, error: currentError } = await supabase
      .from("categorias")
      .select("id, image")
      .eq("id", categoryId)
      .eq("storeId", store.UUID)
      .maybeSingle();

    if (currentError) {
      console.error("RouAI Guide category lookup failed:", currentError);
      throw actionError("No se pudo actualizar la categoría.", 500);
    }
    if (!currentCategory) {
      throw actionError("La categoría no pertenece a este negocio.", 404);
    }

    const uploadedImageUrl = Object.hasOwn(payload, "imageUrl")
      ? await uploadActionImage(payload.imageUrl, "category")
      : null;
    const updates = { name, description };
    if (uploadedImageUrl) updates.image = uploadedImageUrl;
    const { data, error } = await supabase
      .from("categorias")
      .update(updates)
      .eq("id", categoryId)
      .eq("storeId", store.UUID)
      .select("id, name, description, image, storeId, order, subtienda, premium")
      .maybeSingle();

    if (error || !data) {
      await cleanupUploadedImage(uploadedImageUrl, "category");
      if (error) {
        console.error("RouAI Guide category update failed:", error);
      }
      throw actionError(
        error?.message ?? "No se pudo actualizar la categoría.",
        error ? 500 : 404,
      );
    }
    if (uploadedImageUrl) {
      await destroyReplacedImage(currentCategory.image, "category");
    }
    return { entity: data };
  }

  if (action === "create_product") {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    const categoryId =
      typeof payload.categoryId === "string" ? payload.categoryId : "";
    const price = Number(payload.price);
    let stock;
    if (store.stocks === true) {
      stock = Number(payload.stock);
      if (!Number.isInteger(stock) || stock < 0 || "available" in payload) {
        throw actionError("Indica una cantidad entera de inventario válida.");
      }
    } else {
      if (
        "stock" in payload ||
        (payload.available !== undefined &&
          typeof payload.available !== "boolean")
      ) {
        throw actionError(
          "Este negocio no controla inventario físico; indica solo si el producto estará disponible para la venta.",
        );
      }
      stock = payload.available === false ? 0 : 1;
    }
    if (!title || title.length > 160) {
      throw actionError("El nombre del producto debe tener entre 1 y 160 caracteres.");
    }
    if (description.length > 2_000) {
      throw actionError("La descripción no puede superar 2000 caracteres.");
    }
    const infoSections = normalizeProductInfoSections(
      payload.info_sections,
      description,
    );
    if (!categoryId) throw actionError("Selecciona una categoría.");
    if (!Number.isFinite(price) || price < 0) {
      throw actionError("Indica un precio válido, igual o mayor que cero.");
    }
    await getCategory(supabase, store.UUID, categoryId);

    const defaultCurrency =
      store.monedas?.find((currency) => currency.defecto) ?? store.monedas?.[0];
    if (!defaultCurrency?.id) {
      throw actionError("Configura una moneda en la tienda antes de crear productos.", 409);
    }

    let uploadedImageUrl = null;
    if (Object.hasOwn(payload, "imageUrl")) {
      uploadedImageUrl = await uploadActionImage(payload.imageUrl, "product");
    }

    const cleanProductImage = () =>
      cleanupUploadedImage(uploadedImageUrl, "product");

    const { data: created, error: createError } = await supabase
      .rpc("create_product", {
        _title: title,
        _default_moneda: Number(defaultCurrency.id),
        _caja: categoryId,
        _venta: true,
        _descripcion: description,
        _span: false,
        _caracteristicas: [],
        _storeid: store.UUID,
        _creado: new Date().toISOString(),
        _order: 10_000,
        _visible: true,
        _info_sections: infoSections,
        _publish_at: null,
      })
      .single();

    if (createError) {
      await cleanProductImage();
      console.error("RouAI Guide product creation RPC failed:", createError);
      throw actionError("No se pudo crear el producto. Revisa el límite de tu plan y vuelve a intentarlo.", 400);
    }
    if (created?.error || !created?.productId) {
      await cleanProductImage();
      throw actionError(
        created?.error || "RouMenu no devolvió el producto creado.",
        400,
      );
    }

    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: created.productId,
        label: "Estándar",
        attributes: { es_default: true },
        price,
        old_price: 0,
        stock,
        image: uploadedImageUrl,
        default_variant: true,
        force_price: {},
      })
      .select("id, label, attributes, price, old_price, stock, image, default_variant")
      .single();

    if (variantError || !variants) {
      if (variantError) {
        console.error("RouAI Guide product variant creation failed:", variantError);
      }
      const { error: cleanupError } = await supabase
        .from("Products")
        .delete()
        .eq("productId", created.productId)
        .eq("storeId", store.UUID);
      if (cleanupError) {
        console.error("RouAI Guide could not clean up an incomplete product:", cleanupError);
      }
      await cleanProductImage();
      throw actionError(
        cleanupError
          ? "El producto quedó parcialmente creado y requiere revisión en Productos."
          : "No se pudo guardar la variante del producto; se canceló la creación.",
        500,
      );
    }

    return {
      entity: {
        ...created,
        info_sections: infoSections,
        variants: [variants],
      },
    };
  }

  if (action === "update_product") {
    const productId = payload.productId;
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    const categoryId =
      typeof payload.categoryId === "string" ? payload.categoryId : "";
    if (!isUuid(productId)) throw actionError("Selecciona un producto válido.");
    if (!title || title.length > 160) {
      throw actionError("El nombre del producto debe tener entre 1 y 160 caracteres.");
    }
    if (description.length > 2_000) {
      throw actionError("La descripción no puede superar 2000 caracteres.");
    }
    await getCategory(supabase, store.UUID, categoryId);

    let updatedVariant = null;
    let previousImage = null;
    let uploadedImageUrl = null;
    if (Object.hasOwn(payload, "imageUrl")) {
      const { data: currentProduct, error: productLookupError } = await supabase
        .from("Products")
        .select("productId")
        .eq("productId", productId)
        .eq("storeId", store.UUID)
        .maybeSingle();
      if (productLookupError || !currentProduct) {
        if (productLookupError) {
          console.error("RouAI Guide product ownership check failed:", productLookupError);
        }
        throw actionError(
          "El producto no pertenece a este negocio.",
          productLookupError ? 500 : 404,
        );
      }

      const { data: currentVariants, error: variantLookupError } = await supabase
        .from("product_variants")
        .select("id, image, default_variant, attributes")
        .eq("product_id", productId);
      const currentVariant =
        currentVariants?.find((variant) => variant.default_variant) ??
        currentVariants?.find((variant) => variant.attributes?.es_default) ??
        currentVariants?.[0] ??
        null;
      if (variantLookupError || !currentVariant) {
        if (variantLookupError) {
          console.error("RouAI Guide product variant lookup failed:", variantLookupError);
        }
        throw actionError(
          "No se encontró la variante principal para cambiar la imagen.",
          variantLookupError ? 500 : 409,
        );
      }

      previousImage = currentVariant.image;
      updatedVariant = currentVariant.id;
      uploadedImageUrl = await uploadActionImage(payload.imageUrl, "product");
      const { error: imageUpdateError } = await supabase
        .from("product_variants")
        .update({ image: uploadedImageUrl })
        .eq("id", updatedVariant)
        .eq("product_id", productId);
      if (imageUpdateError) {
        await cleanupUploadedImage(uploadedImageUrl, "product");
        console.error("RouAI Guide product image update failed:", imageUpdateError);
        throw actionError("No se pudo actualizar la imagen del producto.", 500);
      }
    }

    const { data, error } = await supabase
      .from("Products")
      .update({ title, descripcion: description, caja: categoryId })
      .eq("productId", productId)
      .eq("storeId", store.UUID)
      .select("productId, title, descripcion, caja, storeId")
      .maybeSingle();

    if (error) {
      if (updatedVariant) {
        const { error: rollbackError } = await supabase
          .from("product_variants")
          .update({ image: previousImage })
          .eq("id", updatedVariant)
          .eq("product_id", productId);
        if (rollbackError) {
          console.error("RouAI Guide product image rollback failed:", rollbackError);
        }
        await cleanupUploadedImage(uploadedImageUrl, "product");
      }
      console.error("RouAI Guide product update failed:", error);
      throw actionError("No se pudo actualizar el producto.", 500);
    }
    if (!data) {
      if (updatedVariant) {
        const { error: rollbackError } = await supabase
          .from("product_variants")
          .update({ image: previousImage })
          .eq("id", updatedVariant)
          .eq("product_id", productId);
        if (rollbackError) {
          console.error("RouAI Guide product image rollback failed:", rollbackError);
        }
        await cleanupUploadedImage(uploadedImageUrl, "product");
      }
      throw actionError("El producto no pertenece a este negocio.", 404);
    }
    if (updatedVariant) {
      await destroyReplacedImage(previousImage, "product");
      data.image = uploadedImageUrl;
      data.variantId = updatedVariant;
    }
    return { entity: data };
  }

  if (action === "update_store") {
    const updates = {};
    for (const [key, rawValue] of Object.entries(payload.fields ?? {})) {
      if (!STORE_TEXT_FIELDS.has(key) || typeof rawValue !== "string") continue;
      const value = rawValue.trim();
      const maxLength = key === "parrrafo" || key === "history" ? 2_000 : 160;
      if (value.length > maxLength) {
        throw actionError(`El campo ${key} supera el máximo de ${maxLength} caracteres.`);
      }
      updates[key] = value || null;
    }
    if (Object.hasOwn(updates, "name") && !updates.name) {
      throw actionError("El negocio debe tener un nombre.");
    }
    if (
      updates.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
    ) {
      throw actionError("El correo electrónico no tiene un formato válido.");
    }

    const uploadedStoreImages = [];
    for (const [payloadKey, storeKey, currentKey] of [
      ["bannerUrl", "banner", "banner"],
      ["posterUrl", "urlPoster", "urlPoster"],
    ]) {
      if (!Object.hasOwn(payload.fields ?? {}, payloadKey)) continue;
      try {
        const uploadedImageUrl = await uploadActionImage(
          payload.fields[payloadKey],
          "store",
        );
        updates[storeKey] = uploadedImageUrl;
        uploadedStoreImages.push({
          uploadedImageUrl,
          previousImage: store[currentKey],
          label: payloadKey,
        });
      } catch (error) {
        await Promise.all(
          uploadedStoreImages.map(({ uploadedImageUrl, label }) =>
            cleanupUploadedImage(uploadedImageUrl, label),
          ),
        );
        throw error;
      }
    }
    if (!Object.keys(updates).length) {
      throw actionError("No se recibieron campos válidos para actualizar.");
    }

    const { data, error } = await supabase
      .from("Sitios")
      .update(updates)
      .eq("UUID", store.UUID)
      .select("UUID, name, parrrafo, history, cell, email, direccion, banner, urlPoster")
      .single();
    if (error) {
      await Promise.all(
        uploadedStoreImages.map(({ uploadedImageUrl, label }) =>
          cleanupUploadedImage(uploadedImageUrl, label),
        ),
      );
      console.error("RouAI Guide store update failed:", error);
      throw actionError("No se pudo actualizar la información del negocio.", 500);
    }
    await Promise.all(
      uploadedStoreImages.map(({ previousImage, label }) =>
        destroyReplacedImage(previousImage, label),
      ),
    );
    return { entity: data };
  }

  if (action === "create_blog_post") {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const abstract =
      typeof payload.abstract === "string" ? payload.abstract.trim() : "";
    const content =
      typeof payload.content === "string" ? payload.content.trim() : "";
    const proposedSlug =
      typeof payload.slug === "string" ? payload.slug.trim() : "";
    if (!title || title.length > 160) {
      throw actionError("El título del post debe tener entre 1 y 160 caracteres.");
    }
    if (abstract.length > 500) {
      throw actionError("El extracto no puede superar 500 caracteres.");
    }
    if (!content || content.length > 10_000) {
      throw actionError("El contenido debe tener entre 1 y 10000 caracteres.");
    }
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(proposedSlug) ||
      proposedSlug.length > 120 ||
      proposedSlug !== createBlogSlug(title)
    ) {
      throw actionError("La dirección del post no es válida.");
    }

    const slug = await getUniqueBlogSlug(supabase, proposedSlug);
    const uploadedImageUrl = Object.hasOwn(payload, "imageUrl")
      ? await uploadActionImage(payload.imageUrl, "blog")
      : null;
    const { data, error } = await supabase
      .from("blogs")
      .insert({
        title,
        slug,
        abstract,
        description: markdownToSafeBlogHtml(content),
        published: true,
        publish_at: null,
        former: null,
        next: null,
        image: uploadedImageUrl,
        ui_store: store.UUID,
      })
      .select("*")
      .single();

    if (error) {
      await cleanupUploadedImage(uploadedImageUrl, "blog");
      console.error("RouAI Guide blog post creation failed:", error);
      throw actionError("No se pudo crear el post publicado.", 500);
    }
    return { entity: data };
  }

  if (action === "update_blog_post") {
    const blogId = payload.blogId;
    if (!isUuid(blogId)) throw actionError("Selecciona un post válido.");
    const { data: currentPost, error: postLookupError } = await supabase
      .from("blogs")
      .select("id, image")
      .eq("id", blogId)
      .eq("ui_store", store.UUID)
      .maybeSingle();
    if (postLookupError || !currentPost) {
      if (postLookupError) {
        console.error("RouAI Guide blog post ownership check failed:", postLookupError);
      }
      throw actionError(
        "El post no pertenece a este negocio.",
        postLookupError ? 500 : 404,
      );
    }

    const uploadedImageUrl = await uploadActionImage(payload.imageUrl, "blog");
    const { data, error } = await supabase
      .from("blogs")
      .update({ image: uploadedImageUrl })
      .eq("id", blogId)
      .eq("ui_store", store.UUID)
      .select("id, title, slug, abstract, image, ui_store")
      .maybeSingle();
    if (error || !data) {
      await cleanupUploadedImage(uploadedImageUrl, "blog");
      if (error) {
        console.error("RouAI Guide blog post image update failed:", error);
      }
      throw actionError(
        "No se pudo actualizar la imagen del post.",
        error ? 500 : 404,
      );
    }
    await destroyReplacedImage(currentPost.image, "blog");
    return { entity: data };
  }

  throw actionError("Operación no disponible.", 400);
}

async function claimRequest(supabase, requestKey, userId, storeId, action) {
  const { data: existing, error: lookupError } = await supabase
    .from("rouai_guide_action_requests")
    .select("action, status, result")
    .eq("request_key", requestKey)
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (lookupError) {
    console.error("RouAI Guide action idempotency lookup failed:", lookupError);
    throw actionError("No se pudo verificar la operación. Confirma que la migración de RouAI Guide esté aplicada.", 503);
  }
  if (existing) {
    if (existing.action !== action) {
      throw actionError("La clave de operación ya fue utilizada para otra acción.", 409);
    }
    return existing;
  }

  const { error: insertError } = await supabase
    .from("rouai_guide_action_requests")
    .insert({
      request_key: requestKey,
      user_id: userId,
      store_id: storeId,
      action,
      status: "pending",
    });

  if (!insertError) return null;

  const { data: raced, error: raceError } = await supabase
    .from("rouai_guide_action_requests")
    .select("action, status, result")
    .eq("request_key", requestKey)
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (raceError || !raced) {
    console.error("RouAI Guide action claim failed:", insertError);
    throw actionError("No se pudo iniciar la operación.", 500);
  }
  if (raced.action !== action) {
    throw actionError("La clave de operación ya fue utilizada para otra acción.", 409);
  }
  return raced;
}

export async function POST(request) {
  if (!validateSameOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonResponse({ error: "Se requiere una petición JSON." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 32_768) {
    return jsonResponse({ error: "La petición excede el tamaño permitido." }, 413);
  }

  const access = await getRouAIGuideAccess();
  if (access.response) return access.response;
  if (access.guideMode !== "advanced") {
    return jsonResponse(
      {
        error:
          "Las acciones administrativas de RouAI requieren el plan Anual.",
      },
      403,
    );
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("RouAI Guide action body read failed:", error);
    return jsonResponse({ error: "No se pudo leer la petición." }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > 32_768) {
    return jsonResponse({ error: "La petición excede el tamaño permitido." }, 413);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    console.error("RouAI Guide action JSON parse failed:", error);
    return jsonResponse({ error: "La petición no contiene JSON válido." }, 400);
  }
  if (
    !isRecord(body) ||
    !ACTIONS.has(body.action) ||
    !isRecord(body.payload) ||
    !isUuid(body.messageId)
  ) {
    return jsonResponse({ error: "La operación no es válida." }, 400);
  }
  if (!validateSameOrigin(request) || body.confirmed !== true) {
    return jsonResponse({ error: "Confirma la operación antes de continuar." }, 400);
  }
  if (!isUuid(body.requestKey)) {
    return jsonResponse({ error: "Falta el identificador único de la operación." }, 400);
  }

  const requiresSettings = body.action === "update_store";
  if (!can(access.storeRole, requiresSettings ? "settings" : "write")) {
    return jsonResponse(
      { error: "Tu rol no tiene permiso para realizar esta operación." },
      403,
    );
  }

  const { data: proposalMessage, error: proposalError } = await access.supabase
    .from("rouai_guide_messages")
    .select("metadata")
    .eq("id", body.messageId)
    .eq("role", "assistant")
    .maybeSingle();

  if (proposalError) {
    console.error("RouAI Guide action proposal could not be verified:", proposalError);
    return jsonResponse(
      { error: "No se pudo verificar el borrador. Confirma que las migraciones de RouAI estén aplicadas." },
      503,
    );
  }

  const proposal = proposalMessage?.metadata;
  if (
    proposal?.type !== "action_proposal" ||
    proposal.requestKey !== body.requestKey ||
    proposal.action !== body.action ||
    canonicalJson(proposal.payload) !== canonicalJson(body.payload)
  ) {
    return jsonResponse(
      { error: "El borrador ya no coincide con la propuesta original de RouAI." },
      409,
    );
  }

  let existing;
  try {
    existing = await claimRequest(
      access.supabase,
      body.requestKey,
      access.user.id,
      access.store.UUID,
      body.action,
    );
  } catch (error) {
    return jsonResponse(
      { error: error.message || "No se pudo verificar la operación." },
      error.status ?? 500,
    );
  }
  if (existing?.status === "completed") {
    return jsonResponse({ ...existing.result, replayed: true });
  }
  if (existing) {
    return jsonResponse(
      {
        error:
          existing.status === "pending"
            ? "Esta operación ya está en curso. No la repitas."
            : "Esta operación ya se intentó y no se repetirá automáticamente.",
        result: existing.result,
      },
      409,
    );
  }

  try {
    const result = await runAction(access, body.action, body.payload);
    const { data: saved, error: saveError } = await access.supabase.rpc(
      "rouai_guide_finish_action",
      {
        target_request_key: body.requestKey,
        target_status: "completed",
        target_result: result,
      },
    );

    if (saveError || !saved) {
      console.error("RouAI Guide action result could not be recorded:", saveError);
      return jsonResponse(
        {
          error:
            "La operación se aplicó, pero no se pudo registrar su resultado. No la repitas; verifica el módulo correspondiente.",
        },
        500,
      );
    }

    return jsonResponse({ ...result, action: body.action });
  } catch (error) {
    const safeResult = { error: error.message || "No se pudo completar la operación." };
    const { error: recordError } = await access.supabase.rpc(
      "rouai_guide_finish_action",
      {
        target_request_key: body.requestKey,
        target_status: "failed",
        target_result: safeResult,
      },
    );
    if (recordError) {
      console.error("RouAI Guide action failure could not be recorded:", recordError);
    }
    return jsonResponse(safeResult, error.status ?? 500);
  }
}

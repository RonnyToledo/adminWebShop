import { can } from "@/lib/permissions";

const textField = { type: "STRING" };
const imageUrlField = {
  type: "STRING",
  description:
    "URL directa de imagen escrita por el usuario en su mensaje actual; no la inventes ni la tomes de una página de resultados.",
};
function getValidatedUserImageUrl(value, userImageUrls) {
  if (value === undefined) return { imageUrl: "" };
  if (typeof value !== "string") {
    return { error: "La dirección de imagen no tiene un formato válido." };
  }
  const imageUrl = value.trim();
  if (!imageUrl) return { imageUrl: "" };
  if (imageUrl.length > 2_048) {
    return { error: "La dirección de imagen supera el tamaño permitido." };
  }
  try {
    const parsedUrl = new URL(imageUrl);
    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !userImageUrls.some((candidate) => new URL(candidate).href === parsedUrl.href)
    ) {
      return {
        error:
          "Solo puedo agregar una URL de imagen que hayas compartido directamente en este mensaje.",
      };
    }
    return { imageUrl: parsedUrl.href };
  } catch {
    return { error: "La dirección de imagen no tiene un formato válido." };
  }
}
const productInfoSectionsField = {
  type: "ARRAY",
  description:
    "Datos ampliados del producto organizados en secciones legibles para RouMenu. Incluye solo hechos proporcionados por el usuario o verificados por las fuentes.",
  items: {
    type: "OBJECT",
    properties: {
      label: {
        type: "STRING",
        description: "Título breve de la sección, por ejemplo Origen o Graduación alcohólica",
      },
      content: {
        type: "STRING",
        description: "Información breve y clara para mostrar en la ficha del producto",
      },
    },
    required: ["label", "content"],
  },
};

const ACTION_TOOLS = [
  {
    name: "create_category",
    action: "create_category",
    permission: "write",
    description:
      "Prepara una propuesta para crear una categoría. No la guarda; el usuario debe confirmar.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { ...textField, description: "Nombre de la nueva categoría" },
        description: { ...textField, description: "Descripción opcional" },
        imageUrl: imageUrlField,
      },
      required: ["name"],
    },
  },
  {
    name: "update_category",
    action: "update_category",
    permission: "write",
    description:
      "Prepara una propuesta para editar una categoría existente del catálogo listado en el contexto. No la guarda; el usuario debe confirmar.",
    parameters: {
      type: "OBJECT",
      properties: {
        categoryId: { ...textField, description: "ID de una categoría del catálogo autorizado" },
        name: { ...textField, description: "Nombre propuesto" },
        description: { ...textField, description: "Descripción propuesta" },
        imageUrl: imageUrlField,
      },
      required: ["categoryId", "name"],
    },
  },
  {
    name: "create_product",
    action: "create_product",
    permission: "write",
    description:
      "Prepara una propuesta para crear un producto. Usa una categoría del catálogo autorizado. Si el negocio controla inventario real, pide la cantidad inicial; si no, registra solo si estará disponible para la venta. No la guarda; el usuario debe confirmar.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { ...textField, description: "Nombre del producto" },
        description: { ...textField, description: "Descripción del producto" },
        infoSections: productInfoSectionsField,
        categoryId: { ...textField, description: "ID de una categoría del catálogo autorizado" },
        price: { type: "NUMBER", description: "Precio inicial del producto" },
        stock: { type: "INTEGER", description: "Inventario inicial, número entero no negativo" },
        imageUrl: imageUrlField,
        originalTitle: {
          ...textField,
          description:
            "Si mejoras una falta ortográfica del nombre, copia aquí exactamente cómo lo escribió el usuario para mostrarle el cambio.",
        },
        spellingNote: {
          ...textField,
          description:
            "Si corriges un nombre propio usando fuentes web verificables, explica brevemente el cambio para que el usuario lo revise.",
        },
        available: {
          type: "BOOLEAN",
          description:
            "Si el negocio no controla inventario físico, indica si el producto estará disponible para la venta; por defecto está disponible.",
        },
      },
      required: ["title", "categoryId", "price", "stock"],
    },
  },
  {
    name: "update_product",
    action: "update_product",
    permission: "write",
    description:
      "Prepara una propuesta para cambiar nombre, descripción, categoría o imagen principal de un producto existente listado en el contexto. No cambia precio ni inventario. El usuario debe confirmar.",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: { ...textField, description: "ID de un producto del catálogo autorizado" },
        title: { ...textField, description: "Nombre propuesto" },
        description: { ...textField, description: "Descripción propuesta" },
        categoryId: { ...textField, description: "ID de una categoría del catálogo autorizado" },
        imageUrl: imageUrlField,
      },
      required: ["productId", "title", "categoryId"],
    },
  },
  {
    name: "update_store",
    action: "update_store",
    permission: "settings",
    description:
      "Prepara una propuesta de actualización de los campos básicos permitidos del negocio. Envía solo campos solicitados explícitamente. No la guarda; el usuario debe confirmar.",
    parameters: {
      type: "OBJECT",
      properties: {
        fields: {
          type: "OBJECT",
          properties: {
            name: textField,
            parrrafo: textField,
            history: textField,
            cell: textField,
            email: textField,
            direccion: textField,
            bannerUrl: imageUrlField,
            posterUrl: imageUrlField,
          },
          description: "Campos que el usuario pidió cambiar",
        },
      },
      required: ["fields"],
    },
  },
  {
    name: "create_blog_post",
    action: "create_blog_post",
    permission: "write",
    description:
      "Prepara una propuesta para crear un post publicado en el blog con título, extracto y contenido en Markdown. El usuario debe revisar y confirmar antes de publicarlo.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { ...textField, description: "Título del post, máximo 160 caracteres" },
        abstract: { ...textField, description: "Extracto breve, máximo 500 caracteres" },
        content: {
          ...textField,
          description:
            "Contenido completo en Markdown con encabezados, párrafos y listas; no incluyas HTML.",
        },
        imageUrl: imageUrlField,
      },
      required: ["title", "abstract", "content"],
    },
  },
  {
    name: "update_blog_post",
    action: "update_blog_post",
    permission: "write",
    description:
      "Prepara una propuesta para cambiar la imagen de un post existente del blog listado en el contexto. No la guarda; el usuario debe confirmar.",
    parameters: {
      type: "OBJECT",
      properties: {
        blogId: { ...textField, description: "ID de un post existente del blog autorizado" },
        imageUrl: imageUrlField,
      },
      required: ["blogId", "imageUrl"],
    },
  },
];

function slugifyBlogTitle(title) {
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

export function getRouAIGuideTools(
  storeRole,
  inventoryEnabled = true,
  webResearchRequested = false,
  advancedEnabled = true,
) {
  if (!advancedEnabled) return [];
  return ACTION_TOOLS.filter((tool) => can(storeRole, tool.permission)).map(
    (tool) => {
      if (tool.name !== "create_product") return tool;
      const properties = { ...tool.parameters.properties };
      if (inventoryEnabled) {
        delete properties.available;
      } else {
        delete properties.stock;
      }
      return {
        ...tool,
        parameters: {
          ...tool.parameters,
          properties,
          required: [
            "title",
            "categoryId",
            "price",
            ...(inventoryEnabled ? ["stock"] : []),
            ...(webResearchRequested ? ["infoSections"] : []),
          ],
        },
      };
    },
  );
}

export function validateRouAIGuideToolCall({
  functionCall,
  storeRole,
  inventoryEnabled = true,
  categories,
  products,
  blogPosts = [],
  userContent = "",
  userImageUrls = [],
  allowSpellingCorrections = false,
  webResearchRequested = false,
  advancedEnabled = true,
}) {
  if (!functionCall || typeof functionCall.name !== "string") {
    return { error: "El modelo devolvió una acción incompleta." };
  }
  const tool = getRouAIGuideTools(
    storeRole,
    inventoryEnabled,
    webResearchRequested,
    advancedEnabled,
  ).find(
    (candidate) => candidate.name === functionCall.name,
  );
  if (!tool) return { error: "La acción solicitada no está permitida para este rol." };

  const args = functionCall.args;
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { error: "El borrador de acción no tiene un formato válido." };
  }
  const categoryIds = new Set(categories.map((category) => String(category.id)));
  const productIds = new Set(products.map((product) => String(product.productId)));
  const blogIds = new Set(blogPosts.map((post) => String(post.id)));
  const stringValue = (value) => typeof value === "string" && value.trim();

  if (tool.action === "create_category") {
    if (!stringValue(args.name)) return { error: "Falta el nombre de la categoría." };
    const image = getValidatedUserImageUrl(args.imageUrl, userImageUrls);
    if (image.error) return image;
    return {
      action: tool.action,
      payload: {
        name: args.name.trim(),
        description: typeof args.description === "string" ? args.description.trim() : "",
        ...(image.imageUrl ? { imageUrl: image.imageUrl } : {}),
      },
    };
  }
  if (tool.action === "update_category") {
    if (!categoryIds.has(String(args.categoryId)) || !stringValue(args.name)) {
      return { error: "Selecciona una categoría existente y proporciona su nombre." };
    }
    const image = getValidatedUserImageUrl(args.imageUrl, userImageUrls);
    if (image.error) return image;
    return {
      action: tool.action,
      payload: {
        categoryId: String(args.categoryId),
        name: args.name.trim(),
        description: typeof args.description === "string" ? args.description.trim() : "",
        ...(image.imageUrl ? { imageUrl: image.imageUrl } : {}),
      },
    };
  }
  if (tool.action === "create_product") {
    const price = Number(args.price);
    const stock = inventoryEnabled ? Number(args.stock) : null;
    const image = getValidatedUserImageUrl(args.imageUrl, userImageUrls);
    if (image.error) return image;
    const imageUrl = image.imageUrl;
    const originalTitle =
      typeof args.originalTitle === "string" ? args.originalTitle.trim() : "";
    const spellingNote =
      typeof args.spellingNote === "string" ? args.spellingNote.trim() : "";
    const normalizeForMatch = (value) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    if (
      !stringValue(args.title) ||
      !categoryIds.has(String(args.categoryId)) ||
      !Number.isFinite(price) ||
      price < 0 ||
      (inventoryEnabled &&
        (!Number.isInteger(stock) ||
          stock < 0 ||
          args.available !== undefined)) ||
      (!inventoryEnabled &&
        (args.stock !== undefined ||
          (args.available !== undefined &&
            typeof args.available !== "boolean")))
    ) {
      return {
        error:
          inventoryEnabled
            ? "El borrador necesita nombre, categoría existente, precio válido e inventario entero no negativo."
            : "El borrador necesita nombre, categoría existente y precio válido. La disponibilidad debe ser sí o no.",
      }
    }
    const proposedTitleNormalized = normalizeForMatch(
      typeof args.title === "string" ? args.title : "",
    );
    const normalizedUserContent = normalizeForMatch(userContent);
    if (
      webResearchRequested &&
      !originalTitle &&
      !normalizedUserContent.includes(proposedTitleNormalized)
    ) {
      return {
        error:
          "El nombre propuesto no aparece tal cual en tu mensaje. Confirma el nombre original antes de sugerir una corrección.",
      };
    }
    if (originalTitle) {
      const originalNormalized = normalizeForMatch(originalTitle);
      if (
        !originalNormalized ||
        !normalizedUserContent.includes(originalNormalized)
      ) {
        return {
          error:
            "No pude verificar el nombre original escrito en el chat. Confírmalo antes de preparar el producto.",
        };
      }
      if (
        originalNormalized !== proposedTitleNormalized &&
        (!allowSpellingCorrections ||
          !spellingNote ||
          spellingNote.length > 240)
      ) {
        return {
          error:
            "No cambiaré la escritura del nombre sin una fuente verificable y una explicación para que la revises.",
        };
      }
      if (
        originalNormalized === proposedTitleNormalized &&
        spellingNote
      ) {
        return {
            error:
              "Solo mostraré una sugerencia ortográfica cuando el nombre propuesto sea distinto del original.",
        };
      }
      if (spellingNote && !allowSpellingCorrections) {
        return {
          error:
            "No puedo sugerir una corrección de nombre sin fuentes web verificables.",
        };
      }
    } else if (spellingNote) {
      return {
        error:
          "No puedo sugerir una corrección de nombre sin identificar cómo lo escribiste originalmente.",
      };
    }
    if (
      args.infoSections !== undefined &&
      (!Array.isArray(args.infoSections) || args.infoSections.length > 8)
    ) {
      return {
        error:
          "La información ampliada debe contener hasta ocho secciones sencillas.",
      };
    }
    const infoSections = [];
    const seenLabels = new Set();
    const seenSectionIds = new Set();
    for (const [index, section] of (args.infoSections ?? []).entries()) {
      if (
        !section ||
        typeof section !== "object" ||
        Array.isArray(section) ||
        typeof section.label !== "string" ||
        typeof section.content !== "string"
      ) {
        return {
          error:
            "Cada dato ampliado necesita un título y una descripción sencilla.",
        };
      }
      const label = section.label.trim();
      const sectionContent = section.content.trim();
      if (!label || label.length > 48 || !sectionContent || sectionContent.length > 500) {
        return {
          error:
            "Revisa los datos ampliados: cada sección debe tener un título corto y contenido de hasta 500 caracteres.",
        };
      }
      const normalizedLabel = label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase();
      if (seenLabels.has(normalizedLabel)) {
        return {
          error:
            "La ficha contiene secciones repetidas. Combina su información bajo un solo título.",
        };
      }
      seenLabels.add(normalizedLabel);
      const sectionSlug = normalizedLabel.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const id =
        normalizedLabel === "descripcion"
          ? "description"
          : `rouai-${sectionSlug || `info-${index + 1}`}`;
      if (seenSectionIds.has(id)) {
        return {
          error:
            "La ficha contiene títulos demasiado parecidos. Usa nombres de sección más claros.",
        };
      }
      seenSectionIds.add(id);
      infoSections.push({
        id,
        label,
        icon: id === "description" ? "FileText" : "Info",
        content: sectionContent,
        order: index,
      });
    }
    const productDescription =
      typeof args.description === "string" ? args.description.trim() : "";
    if (
      productDescription &&
      !infoSections.some((section) => section.id === "description")
    ) {
      infoSections.unshift({
        id: "description",
        label: "Descripción",
        icon: "FileText",
        content: productDescription,
        order: 0,
      });
    }
    const descriptionIndex = infoSections.findIndex(
      (section) => section.id === "description",
    );
    if (descriptionIndex > 0) {
      infoSections.unshift(infoSections.splice(descriptionIndex, 1)[0]);
    }
    if (
      webResearchRequested &&
      !infoSections.some((section) => section.id !== "description")
    ) {
      return {
        error:
          "La búsqueda no produjo detalles comprobables suficientes para completar secciones del producto. No prepararé una ficha con datos inventados.",
      };
    }
    if (infoSections.length > 8) {
      return {
        error:
          "La ficha completa supera el máximo de ocho secciones. Reduce los datos ampliados antes de continuar.",
      };
    }
    infoSections.forEach((section, index) => {
      section.order = index;
    });
    return {
      action: tool.action,
      payload: {
        title: args.title.trim(),
        description: productDescription,
        info_sections: infoSections,
        categoryId: String(args.categoryId),
        price,
        ...(imageUrl ? { imageUrl } : {}),
        ...(inventoryEnabled
          ? { stock }
          : { available: args.available !== false }),
      },
      ...(originalTitle &&
      normalizeForMatch(originalTitle) !==
        normalizeForMatch(args.title)
        ? {
            presentation: {
              originalTitle,
              spellingNote,
            },
          }
        : {}),
    };
  }
  if (tool.action === "update_product") {
    if (
      !productIds.has(String(args.productId)) ||
      !categoryIds.has(String(args.categoryId)) ||
      !stringValue(args.title)
    ) {
      return {
        error:
          "El borrador debe usar un producto y una categoría existentes, y contener un nombre.",
      };
    }
    const image = getValidatedUserImageUrl(args.imageUrl, userImageUrls);
    if (image.error) return image;
    return {
      action: tool.action,
      payload: {
        productId: String(args.productId),
        title: args.title.trim(),
        description: typeof args.description === "string" ? args.description.trim() : "",
        categoryId: String(args.categoryId),
        ...(image.imageUrl ? { imageUrl: image.imageUrl } : {}),
      },
    };
  }
  if (tool.action === "update_store") {
    const allowedFields = new Set([
      "name",
      "parrrafo",
      "history",
      "cell",
      "email",
      "direccion",
    ]);
    if (!args.fields || typeof args.fields !== "object" || Array.isArray(args.fields)) {
      return { error: "No se recibieron campos válidos para editar el negocio." };
    }
    const fields = Object.fromEntries(
      Object.entries(args.fields).filter(
        ([key, value]) => allowedFields.has(key) && typeof value === "string",
      ),
    );
    for (const [key, value] of [
      ["bannerUrl", args.fields.bannerUrl],
      ["posterUrl", args.fields.posterUrl],
    ]) {
      const image = getValidatedUserImageUrl(value, userImageUrls);
      if (image.error) return image;
      if (image.imageUrl) fields[key] = image.imageUrl;
    }
    if (!Object.keys(fields).length) {
      return { error: "Indica qué dato del negocio deseas cambiar." };
    }
    return { action: tool.action, payload: { fields } };
  }
  if (tool.action === "create_blog_post") {
    if (
      !stringValue(args.title) ||
      args.title.trim().length > 160 ||
      typeof args.abstract !== "string" ||
      args.abstract.trim().length > 500 ||
      !stringValue(args.content) ||
      args.content.trim().length > 10_000
    ) {
      return {
        error:
          "El borrador necesita un título (hasta 160 caracteres), un extracto (hasta 500) y contenido (hasta 10000 caracteres).",
      };
    }
    const image = getValidatedUserImageUrl(args.imageUrl, userImageUrls);
    if (image.error) return image;
    return {
      action: tool.action,
      payload: {
        title: args.title.trim(),
        slug: slugifyBlogTitle(args.title.trim()),
        abstract: args.abstract.trim(),
        content: args.content.trim(),
        ...(image.imageUrl ? { imageUrl: image.imageUrl } : {}),
      },
    };
  }
  if (tool.action === "update_blog_post") {
    if (!blogIds.has(String(args.blogId))) {
      return { error: "Selecciona un post existente del blog de este negocio." };
    }
    const image = getValidatedUserImageUrl(args.imageUrl, userImageUrls);
    if (image.error) return image;
    if (!image.imageUrl) {
      return { error: "Incluye la URL de la nueva imagen del post." };
    }
    return {
      action: tool.action,
      payload: { blogId: String(args.blogId), imageUrl: image.imageUrl },
    };
  }
  return { error: "La acción no está implementada." };
}

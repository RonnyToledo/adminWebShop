import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers"; // Importar cookies desde headers
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

const LogUser = async () => {
  const cookie = (await cookies()).get("sb-access-token");
  if (!cookie) {
    return NextResponse.json(
      { message: "No se encontró la cookie de sesión" },
      { status: 401 }
    );
  }
  const parsedCookie = JSON.parse(cookie.value);
  if (parsedCookie.access_token && parsedCookie.refresh_token)
    console.info("Token recividos");
  else console.error("Token no encontrado");
  // Establecer la sesión con los tokens de la cookie
  await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function GET(request, { params }) {
  await LogUser();

  const { data: tienda } = await supabase.from("Products").select("*");
  return NextResponse.json(tienda);
}

export async function POST(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const imageFile = data.get("image");
  const Ui = data.get("UID");

  const newImagesMeta = JSON.parse(data.get("NewImagesSecondaryMeta") || "[]"); // [{index, filename, previewUrl}, ...]
  const imagesecondaryCopy = JSON.parse(data.get("imagesecondaryCopy") || "[]"); // [{index, filename, previewUrl}, ...]
  const uploadedFiles = data.getAll("newImageSecondaryFiles"); // array de Blobs/Files (multipart entries)

  let PrimaryImagen = data.get("image");
  let SecondaryImage = data.get("imagesecondary");

  await Promise.all(
    imagesecondaryCopy
      .filter((obj) => !data.get("imagesecondary").includes(obj))
      .map(async (obj) => {
        await DestroyImage(obj);
        console.info(`${obj} ================ eliminado`);
        return "ok";
      })
  );
  // Crear mapa filename -> blob
  const filesByName = new Map(
    uploadedFiles.map((f) => [f.name || (f.filename ?? ""), f])
  );
  // crear estructura que espera handleNewSecondaryImages
  const newImageSecondary = newImagesMeta
    .map((m) => {
      const file = filesByName.get(m.filename);
      if (!file) {
        console.warn("No se encontró file para", m.filename);
        return null;
      }
      return { index: m.index, file, previewUrl: m.previewUrl };
    })
    .filter(Boolean);
  const aux = await handleNewSecondaryImages(newImageSecondary, SecondaryImage);

  SecondaryImage = aux.length > 0 ? aux : SecondaryImage;

  // 2) Subida a Cloudinary (si hay imagen)
  if (imageFile) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadRes = await new Promise((res, rej) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, (err, result) =>
          err ? rej(err) : res(result)
        )
        .end(buffer);
    });
    PrimaryImagen = uploadRes.secure_url;
  }

  const payload = {
    _title: data.get("title") || "",
    _price: Number(data.get("price") ?? 0),
    _pricecompra: Number(data.get("priceCompra") ?? 0),
    _caja: data.get("caja"), // uuid o null
    _venta: data.get("venta") === "true", // checkbox-like value
    _descripcion: data.get("descripcion") || "",
    _span: data.get("span") === "true",
    _agregados: data.get("agregados") ? JSON.parse(data.get("agregados")) : [],
    _caracteristicas: data.get("caracteristicas"),
    _image_url: PrimaryImagen || null,
    _storeid: Ui, // coincide con el nombre en la función (_storeid)
    _creado: data.get("creado")
      ? new Date(data.get("creado")).toISOString()
      : null,
    _embalaje: Number(data.get("embalaje") ?? 0),
    _order: data.get("order") ? Number(data.get("order")) : null,
    _agotado: data.get("agotado") === "true",
    _visible: data.get("visible") === "true" ? true : null,
    _oldprice: Number(data.get("oldPrice") ?? 0),
    _imagesecondary:
      typeof SecondaryImage == "string"
        ? JSON.parse(SecondaryImage)
        : SecondaryImage, // JS array -> será enviado como JSONB
  };

  console.log("RPC payload", payload);
  // 3) Llamada RPC
  const { data: newProduct, error } = await supabase
    .rpc("create_product", payload)
    .single();
  console.log(newProduct, error);
  if (error) {
    console.error("RPC create_product error:", error);
    return NextResponse.json(
      { message: error.message, details: error.details },
      { status: error.code === "PGRST400" ? 400 : 500 }
    );
  }
  return NextResponse.json(
    {
      ...newProduct,
      caracteristicas:
        typeof newProduct.caracteristicas == "string"
          ? JSON.parse(newProduct.caracteristicas)
          : newProduct.caracteristicas,
    },
    { status: 201 }
  );
}
export async function PUT(request, { params }) {
  const data = await request.formData();
  const products = JSON.parse(data.get("products"));
  try {
    await updateProductsInBatches(products, 10);

    return NextResponse.json({
      message: "Productos actualizados correctamente.",
    });
  } catch (error) {
    console.error("Error en la actualización:", error);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verificar usuario (puede lanzar)
    await LogUser();

    // Obtener formData y parsear valores
    const data = await request.formData();
    const valuesRaw = data.get("values");
    if (!valuesRaw) {
      return NextResponse.json(
        { message: "No se recibieron 'values' en el formData" },
        { status: 400 }
      );
    }

    let values;
    try {
      values = JSON.parse(valuesRaw);
    } catch (err) {
      return NextResponse.json(
        { message: "JSON inválido en 'values'", detail: err.message },
        { status: 400 }
      );
    }

    if (!Array.isArray(values) || values.length === 0) {
      return NextResponse.json(
        { message: "'values' debe ser un array no vacío" },
        { status: 400 }
      );
    }

    // --- Eliminación de imágenes (paralela) ---
    // Se asume que cada objeto 'val' puede tener una propiedad 'imageOld' (ajusta si tu campo se llama distinto)
    const imageDeletes = values
      .filter((v) => v.imageOld) // solo los que tienen imagen antigua
      .map((v) => DestroyImage(v.imageOld)); // devuelve promesas

    // Esperamos todas las promesas: usamos allSettled para registrar fallos sin romper todo
    const imageResults = await Promise.allSettled(imageDeletes);

    const imageFailures = imageResults
      .map((r, i) => ({ r, val: values[i] }))
      .filter((x) => x.r.status === "rejected");

    if (imageFailures.length) {
      // Solo logueamos; no abortamos la eliminación de productos. Cambia esto si quieres abortar.
      console.warn("Algunas imágenes no se pudieron eliminar:", imageFailures);
    }

    // --- Eliminación en Supabase ---
    const ids = values.map((v) => v.productId).filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json(
        { message: "No se encontraron productId válidos en 'values'" },
        { status: 400 }
      );
    }

    const { data: tienda, error } = await supabase
      .from("Products")
      .delete()
      .in("productId", ids);

    if (error) {
      console.error("Error al borrar productos en Supabase:", error);
      return NextResponse.json(
        {
          message: "Error al borrar productos",
          detail: error.message ?? error,
        },
        { status: 500 }
      );
    }

    console.info("Tarea completada: productos borrados", ids);
    return NextResponse.json(
      { message: "Tarea completada", tienda },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error inesperado en DELETE:", err);
    return NextResponse.json(
      { message: "Error interno del servidor", detail: err.message ?? err },
      { status: 500 }
    );
  }
}

async function updateProductsInBatches(products, batchSize = 10) {
  await LogUser();

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (product) => {
        const { productId, agotado, order, title, caja, visible } = product;
        const { data: prod, error } = await supabase
          .from("Products")
          .update({ agotado, order, caja, visible })
          .eq("productId", productId)
          .select("*");
        if (error) {
          console.error(
            `Error al actualizar el producto ${title}: ${error.message}`
          );
          throw new Error(
            `Error actualizando producto ${title}: ${error.message}`
          );
        }
      })
    );
  }
}

async function handleNewSecondaryImages(newImageSecondary, SecondaryImage) {
  // si no hay nada que procesar devolvemos el original en forma de array
  if (!Array.isArray(newImageSecondary) || newImageSecondary.length === 0) {
    return Array.isArray(SecondaryImage) ? SecondaryImage : [];
  }

  // --- Normalizar SecondaryImage a array ---
  let existing = [];
  if (typeof SecondaryImage === "string") {
    try {
      const parsed = JSON.parse(SecondaryImage);
      existing = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // si no es JSON, intentamos usarlo como single-value
      existing = SecondaryImage ? [SecondaryImage] : [];
    }
  } else if (Array.isArray(SecondaryImage)) {
    existing = [...SecondaryImage];
  } else {
    existing = [];
  }

  // --- Crear 'updated' evitando holes ---
  // Determinar la longitud mínima necesaria: la mayor entre existing.length y maxIndex+1
  const maxIndex = newImageSecondary.reduce((m, it) => {
    const i = Number(it?.index);
    return Number.isFinite(i) ? Math.max(m, i) : m;
  }, -1);
  const neededLength = Math.max(existing.length, maxIndex + 1, 0);

  // inicializamos con los valores existentes (o null si no existía)
  const updated = Array.from({ length: neededLength }, (_, i) =>
    i < existing.length ? existing[i] : null
  );

  // --- Procesar cada item ---
  for (const item of newImageSecondary) {
    try {
      const idx = Number(item?.index);
      const file = item?.file;

      if (!Number.isFinite(idx)) {
        console.warn("Índice inválido, se salta item:", item);
        continue;
      }

      // detectar file-like (servidor: Blob, File, Buffer, Stream...)
      const isFileLike =
        file &&
        (typeof file.arrayBuffer === "function" ||
          typeof file.stream === "function" ||
          typeof file.pipe === "function" ||
          (typeof Buffer !== "undefined" && file instanceof Buffer));

      if (!isFileLike) {
        console.warn("Item sin archivo válido (no file-like), se salta:", item);
        continue;
      }

      // borrar imagen antigua si existe
      const toDelete = updated[idx];
      if (toDelete) {
        try {
          await DestroyImage(toDelete);
        } catch (err) {
          console.warn("Error borrando imagen antigua:", err);
          // no rompemos, intentamos subir de todas formas
        }
      }

      // subir nuevo archivo (UploadNewImage debe aceptar Blob/File/Buffer)
      const uploadedRes = await UploadNewImage(file);
      const uploadedUrl = uploadedRes?.secure_url ?? uploadedRes;

      // asignamos en la posición correcta (no creamos holes porque 'updated' ya tiene longitud necesaria)
      updated[idx] = uploadedUrl;
      // NO return aquí; seguimos procesando todos los items
    } catch (err) {
      console.error("Failed processing item", item, err);
      // seguimos con los demás
    }
  }

  // opcional: si quieres eliminar nulls y compactar, hazlo aquí.
  // return updated.filter(Boolean);

  return updated;
}

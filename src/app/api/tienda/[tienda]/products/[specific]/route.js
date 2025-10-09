import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers"; // Importar cookies desde headers
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

export async function GET(request, { params }) {
  await LogUser();
  const { tienda, specific } = await params;
  const { data } = await supabase
    .from(tienda)
    .select("*")
    .eq("productId", specific);

  return NextResponse.json(...new Set(data));
}
export async function POST(request, { params }) {
  await LogUser();
  const { specific } = await params;

  const data = await request.formData();
  const { data: tienda, error } = await supabase
    .from("Products")
    .update([
      {
        coment: data.get("comentario"),
      },
    ])
    .select("*")
    .eq("productId", specific);
  if (error) {
    console.error(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }
  return NextResponse.json({ message: "Comentario realizado" });
}

export async function PUT(request, { params }) {
  await LogUser();
  const data = await request.formData();
  // obtener metadata y archivos del formData
  const newImagesMeta = JSON.parse(data.get("NewImagesSecondaryMeta") || "[]"); // [{index, filename, previewUrl}, ...]
  const imagesecondaryCopy = JSON.parse(data.get("imagesecondaryCopy") || "[]"); // [{index, filename, previewUrl}, ...]
  const uploadedFiles = data.getAll("newImageSecondaryFiles"); // array de Blobs/Files (multipart entries)
  let PrimaryImagen = data.get("image");
  let SecondaryImage = data.get("imagesecondary");
  const Id = data.get("Id");

  const newImagePrimary = data.get("newImage");

  const val = await Promise.all(
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

  //Si tenemos imagen nueva
  if (newImagePrimary) {
    //Eliminamos la vieja
    console.info("No deberiamos estar aqui");
    if (PrimaryImagen) {
      console.info("Eliminando imagen antigua");
      await DestroyImage(PrimaryImagen);
    }
    console.info("salto la eliminacion");
    const res = await UploadNewImage(newImagePrimary);
    if (res.secure_url) {
      console.info("Imagen creada");
      PrimaryImagen = res.secure_url;
    }
  }
  const aux = await handleNewSecondaryImages(newImageSecondary, SecondaryImage);

  SecondaryImage = aux.length > 0 ? aux : SecondaryImage;

  const payload = {
    _productid: data.get("Id"),
    _title: data.get("title"),
    _price: Number(data.get("price") ?? 0),
    _default_moneda: Number(data.get("default_moneda") ?? 0),
    _pricecompra: Number(data.get("priceCompra") ?? 0),
    _caja: data.get("caja"),
    _venta: data.get("venta") === "true",
    _descripcion: data.get("descripcion"),
    _span: data.get("span") === "true",
    _caracteristicas: data.get("caracteristicas"),
    _image_url: PrimaryImagen,
    _storeid: data.get("storeId"),
    _creado: data.get("creado"),
    _embalaje: Number(data.get("embalaje") ?? 0),
    _order: Number(data.get("order") ?? 0),
    _stock: Number(data.get("stock") ?? 0),
    _visible: data.get("visible") === "true",
    _oldprice: Number(data.get("oldPrice") ?? 0),
    _imagesecondary:
      typeof SecondaryImage == "string"
        ? JSON.parse(SecondaryImage)
        : SecondaryImage, // JS array -> será enviado como JSONB
    _agregados: data.get("agregados") ? JSON.parse(data.get("agregados")) : [],
  };

  const { data: tienda, error } = await supabase
    .rpc("update_product", payload)
    .single();

  if (error) {
    console.error("Error", error);

    return NextResponse.json(
      { message: error },
      {
        status: 402,
      }
    );
  }
  return NextResponse.json(tienda);
}
export async function DELETE(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const imageOld = data.get("image");
  const Id = data.get("Id");
  if (imageOld) {
    DestroyImage(imageOld);
  }
  const { data: tienda, error } = await supabase
    .from("Products")
    .delete()
    .eq("productId", Id);
  if (error) {
    console.error(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }
  console.info("Tarea completada");
  return NextResponse.json(tienda);
}
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
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

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

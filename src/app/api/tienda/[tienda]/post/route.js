import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

function routeError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function readImageFile(formData) {
  const image = formData.get("image");
  if (image === null || image === "") return null;
  if (typeof image === "string" || typeof image.arrayBuffer !== "function") {
    throw routeError("La portada debe ser un archivo de imagen válido.");
  }
  if (!image.type.startsWith("image/")) {
    throw routeError("La portada debe ser un archivo de imagen válido.");
  }
  if (image.size > 10 * 1024 * 1024) {
    throw routeError("La portada debe pesar 10 MB o menos.");
  }
  return image;
}

function errorResponse(error, fallbackStatus = 500) {
  return NextResponse.json(
    { error: error?.message ?? String(error) },
    { status: error?.status ?? fallbackStatus },
  );
}

async function assertStoreAccess(supabase, userId, storeId) {
  if (!storeId) throw routeError("La tienda es obligatoria.");

  const { data: membership, error: memberError } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (membership) return;

  const { data: legacyStore, error: legacyError } = await supabase
    .from("Sitios")
    .select("UUID")
    .eq("UUID", storeId)
    .eq("Editor", userId)
    .maybeSingle();

  if (legacyError) throw legacyError;
  if (!legacyStore) {
    throw routeError("No tienes acceso a esta tienda.", 403);
  }
}

async function resolveBlogReference(supabase, storeId, reference, label) {
  if (!reference) return null;

  let { data, error } = await supabase
    .from("blogs")
    .select("id, slug")
    .eq("ui_store", storeId)
    .eq("slug", reference)
    .maybeSingle();

  if (error) throw error;

  if (!data && /^\d+$/.test(reference)) {
    ({ data, error } = await supabase
      .from("blogs")
      .select("id, slug")
      .eq("ui_store", storeId)
      .eq("id", reference)
      .maybeSingle());
    if (error) throw error;
  }

  if (!data?.slug) {
    throw routeError(
      `No se encontró el post indicado en "${label}" dentro de esta tienda.`,
    );
  }

  return data;
}

async function resolveBlogLinks(
  supabase,
  storeId,
  former,
  next,
  currentSlug,
  currentId,
) {
  const [formerPost, nextPost] = await Promise.all([
    resolveBlogReference(supabase, storeId, former, "Post anterior"),
    resolveBlogReference(supabase, storeId, next, "Post siguiente"),
  ]);
  const linkedPosts = [formerPost, nextPost].filter(Boolean);
  const linkedIds = linkedPosts.map((post) => String(post.id));
  const slugs = linkedPosts.map((post) => post.slug);

  if (
    (currentId && linkedIds.includes(String(currentId))) ||
    new Set(slugs).size !== slugs.length ||
    slugs.includes(currentSlug)
  ) {
    throw routeError("Los posts anterior y siguiente deben ser diferentes.");
  }
  return {
    former: formerPost?.slug ?? null,
    next: nextPost?.slug ?? null,
  };
}

function readPublishAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw routeError("La fecha de publicación no es válida.");
  }
  return date.toISOString();
}

async function readPostFields(
  formData,
  supabase,
  storeId,
  currentId = null,
) {
  const title = String(formData.get("title") ?? "").trim();
  const slugBase = String(formData.get("slug") ?? "").trim();
  if (!title || !slugBase) {
    throw routeError("El título y el slug son obligatorios.");
  }

  const formerValue = String(formData.get("former") ?? "").trim();
  const nextValue = String(formData.get("next") ?? "").trim();
  const slug = await generateUniqueSlug(supabase, slugBase, currentId);
  const { former, next } = await resolveBlogLinks(
    supabase,
    storeId,
    formerValue,
    nextValue,
    slug,
    currentId,
  );

  return {
    title,
    slug,
    description: String(formData.get("description") ?? ""),
    abstract: String(formData.get("abstract") ?? ""),
    published: formData.get("published") === "true",
    publish_at: readPublishAt(formData.get("publish_at")),
    former,
    next,
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req) {
  let uploadedImage = null;

  try {
    const { supabase, user } = await requireRouteUser();

    const formData = await req.formData();
    const ui_store = String(formData.get("ui_store") ?? "");
    await assertStoreAccess(supabase, user.id, ui_store);
    const fields = await readPostFields(formData, supabase, ui_store);
    const img = readImageFile(formData);

    let image = null;
    if (img) {
      const uploadedRes = await UploadNewImage(img);
      image = uploadedRes?.secure_url ?? uploadedRes;
      uploadedImage = uploadedRes?.secure_url ?? null;
    }

    const datos = {
      image,
      ui_store,
      ...fields,
    };

    const { data, error } = await supabase
      .from("blogs")
      .insert(datos)
      .select("*")
      .single();

    if (error) {
      if (uploadedImage) {
        await DestroyImage(uploadedImage).catch((cleanupError) =>
          console.error("Error limpiando imagen del post:", cleanupError),
        );
      }
      return NextResponse.json(
        { error: error?.message ?? String(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (uploadedImage) {
      await DestroyImage(uploadedImage).catch((cleanupError) =>
        console.error("Error limpiando imagen del post:", cleanupError),
      );
    }
    console.error("POST /post error:", err);
    return errorResponse(err);
  }
}

export async function PATCH(req) {
  let uploadedImage = null;

  try {
    const { supabase, user } = await requireRouteUser();
    const formData = await req.formData();
    const ui_store = String(formData.get("ui_store") ?? "");
    const id = String(formData.get("id") ?? "");
    await assertStoreAccess(supabase, user.id, ui_store);
    if (!id) throw routeError("El ID del post es obligatorio.");

    const { data: currentPost, error: currentPostError } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .eq("ui_store", ui_store)
      .maybeSingle();
    if (currentPostError) throw currentPostError;
    if (!currentPost) throw routeError("No se encontró el post.", 404);

    const fields = await readPostFields(formData, supabase, ui_store, id);
    const img = readImageFile(formData);
    let image = currentPost.image;
    if (img) {
      const uploadedRes = await UploadNewImage(img);
      image = uploadedRes?.secure_url ?? uploadedRes;
      uploadedImage = uploadedRes?.secure_url ?? null;
    } else if (formData.get("remove_image") === "true") {
      image = null;
    }

    const { data, error } = await supabase
      .from("blogs")
      .update({ ...fields, image })
      .eq("id", id)
      .eq("ui_store", ui_store)
      .select("*")
      .single();

    if (error) throw error;
    if (currentPost.image && currentPost.image !== image) {
      await DestroyImage(currentPost.image).catch((cleanupError) =>
        console.error("Error eliminando la portada anterior del post:", cleanupError),
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (uploadedImage) {
      await DestroyImage(uploadedImage).catch((cleanupError) =>
        console.error("Error limpiando imagen del post:", cleanupError),
      );
    }
    console.error("PATCH /post error:", err);
    return errorResponse(err);
  }
}

export async function DELETE(req) {
  try {
    const { supabase, user } = await requireRouteUser();

    const formData = await req.formData();
    const slug = String(formData.get("slug") ?? "");
    const ui_store = String(formData.get("ui_store") ?? "");
    await assertStoreAccess(supabase, user.id, ui_store);
    if (!slug) throw routeError("El slug del post es obligatorio.");

    const { data: post, error: postError } = await supabase
      .from("blogs")
      .select("id, slug, image")
      .eq("slug", slug)
      .eq("ui_store", ui_store)
      .maybeSingle();
    if (postError) throw postError;
    if (!post) throw routeError("No se encontró el post.", 404);

    const { error: formerError } = await supabase
      .from("blogs")
      .update({ former: null })
      .eq("former", post.slug)
      .eq("ui_store", ui_store);
    if (formerError) throw formerError;

    const { error: nextError } = await supabase
      .from("blogs")
      .update({ next: null })
      .eq("next", post.slug)
      .eq("ui_store", ui_store);
    if (nextError) throw nextError;

    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", post.id)
      .eq("ui_store", ui_store);

    if (error) throw error;
    if (post.image) {
      await DestroyImage(post.image).catch((cleanupError) =>
        console.error("Error eliminando portada del post eliminado:", cleanupError),
      );
    }

    return NextResponse.json({ data: { id: post.id } }, { status: 200 });
  } catch (err) {
    console.error("DELETE /post error:", err);
    return errorResponse(err);
  }
}

async function generateUniqueSlug(supabase, slugBase, excludeId = null) {
  let slug = slugBase;
  let counter = 1;

  while (true) {
    let query = supabase
      .from("blogs")
      .select("id")
      .eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return slug;

    slug = `${slugBase}_${counter}`;
    counter++;
  }
}

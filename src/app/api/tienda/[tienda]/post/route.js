// app/api/gemini/route.ts
import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req) {
  try {
    const supabase = await getAuthenticatedSupabase();

    const formData = await req.formData();
    const ui_store = formData.get("ui_store");
    const slug = await generateUniqueSlug("blogs", formData.get("slug"));
    const title = formData.get("title");
    const description = formData.get("description");
    const abstract = formData.get("abstract");
    const img = formData.get("image");
    let image = null;

    if (img) {
      const uploadedRes = await UploadNewImage(img);
      image = uploadedRes?.secure_url ?? uploadedRes;
    }
    const datos = { image, abstract, description, slug, title, ui_store };

    const { data, error } = await supabase
      .from("blogs")
      .insert(datos)
      .select("*")
      .single();

    if (error) {
      NextResponse.json(
        { error: error?.message ?? String(error) },
        { status: 500 },
      );
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const supabase = await getAuthenticatedSupabase();

    const formData = await req.formData();
    const slug = formData.get("slug");
    const img = formData.get("image");

    if (img) {
      await DestroyImage(img);
    }

    const { data, error } = await supabase
      .from("blogs")
      .delete()
      .eq("slug", slug);

    if (error) {
      NextResponse.json(
        { error: error?.message ?? String(error) },
        { status: 500 },
      );
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
async function generateUniqueSlug(table, slugBase) {
  let slug = slugBase;
  let counter = 1;

  while (true) {
    // Consultar si ya existe este slug
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error checking slug:", error);
      break;
    }

    if (!data) {
      // ✅ Slug disponible
      return slug;
    }

    // ❌ Ya existe → Generar siguiente intento
    slug = `${slugBase}_${counter}`;
    counter++;
  }
}

import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req) {
  try {
    const { supabase } = await requireRouteUser();

    const formData = await req.formData();
    const ui_store = formData.get("ui_store");
    const title = formData.get("title");
    const description = formData.get("description");
    const abstract = formData.get("abstract");
    const img = formData.get("image");

    // Generar slug único pasando supabase como argumento
    const slug = await generateUniqueSlug(
      supabase,
      "blogs",
      formData.get("slug"),
    );

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
      return NextResponse.json(
        // ← return
        { error: error?.message ?? String(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("POST /post error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const { supabase } = await requireRouteUser();

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
      return NextResponse.json(
        // ← return
        { error: error?.message ?? String(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("DELETE /post error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

// Recibe supabase como parámetro — no llama a requireRouteUser internamente
async function generateUniqueSlug(supabase, table, slugBase) {
  let slug = slugBase;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error checking slug:", error);
      break;
    }

    if (!data) return slug;

    slug = `${slugBase}_${counter}`;
    counter++;
  }

  return slug; // fallback si el while rompe por error
}

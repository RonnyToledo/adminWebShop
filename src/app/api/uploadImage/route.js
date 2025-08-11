// app/api/upload/route.js
import { NextResponse } from "next/server";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file"); // <-- aquí recibes el File/Blob

    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
    // subir a Cloudinary vía upload_stream
    const result = await UploadNewImage(file);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
export async function DELETE(req) {
  try {
    const formData = await req.formData();
    const img = formData.get("img"); // <-- aquí recibes el File/Blob

    if (!img) return NextResponse.json({ error: "no img" }, { status: 400 });
    // subir a Cloudinary vía upload_stream
    const result = await DestroyImage(file);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

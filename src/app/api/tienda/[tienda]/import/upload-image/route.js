// api/tienda/[tienda]/products/import/upload-image/route.js
import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import { UploadNewImage } from "@/components/globalFunction/imagesMove";
import { uploadRemoteImage } from "@/lib/remote-image-upload";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Sube UNA imagen del catálogo (reutiliza tu helper UploadNewImage, el mismo
 * que usa POST /products para las imágenes de variantes). Al pasar por el
 * backend evitamos exponer credenciales de Cloudinary / presets en el cliente.
 *
 * El front llama esto en lotes pequeños (5 en paralelo) para no saturar.
 */
export async function POST(request) {
  try {
    try {
      await requireRouteUser();
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    let file = formData.get("file");
    const remoteUrl = formData.get("url");

    if (!file && typeof remoteUrl === "string") {
      const secureUrl = await uploadRemoteImage(remoteUrl);
      return NextResponse.json({ secure_url: secureUrl });
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { message: "Falta un archivo o URL de imagen válido" },
        { status: 400 },
      );
    }

    const fileType = file.type || "";
    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { message: "El archivo no es una imagen válida" },
        { status: 400 },
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: "La imagen supera el límite de 10 MB" },
        { status: 400 },
      );
    }

    const res = await UploadNewImage(file);

    if (!res?.secure_url) {
      return NextResponse.json(
        { message: "No se pudo subir la imagen" },
        { status: 500 },
      );
    }

    return NextResponse.json({ secure_url: res.secure_url });
  } catch (error) {
    console.error("Error subiendo imagen del catálogo:", error);
    return NextResponse.json(
      { message: error.message || "Error subiendo imagen" },
      { status: error.status ?? 500 },
    );
  }
}

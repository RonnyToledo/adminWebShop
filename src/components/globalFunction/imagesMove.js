import { extractPublicId } from "cloudinary-build-url";
import cloudinary from "@/lib/cloudinary";
export async function DestroyImage(image) {
  const publicId = extractPublicId(image);
  await cloudinary.uploader.destroy(publicId, (error, result) => {
    if (error) {
      console.error("Error eliminando imagen:", error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    } else {
      console.info("Imagen eliminada:", result);
    }
  });
}
export async function UploadNewImage(image) {
  const byte = await image.arrayBuffer();
  const buffer = Buffer.from(byte);
  return await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      })
      .end(buffer);
  });
}

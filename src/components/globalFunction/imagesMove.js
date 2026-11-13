import { extractPublicId } from "cloudinary-build-url";
import cloudinary, { assertCloudinaryConfigured } from "@/lib/cloudinary";

export async function DestroyImage(image) {
  const publicId = extractPublicId(image);
  if (!publicId) return null;
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Error eliminando imagen:", error);
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export async function UploadNewImage(image) {
  assertCloudinaryConfigured();
  const byte = await image.arrayBuffer();
  const buffer = Buffer.from(byte);
  return await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      })
      .end(buffer);
  });
}

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";
import { UploadNewImage } from "@/components/globalFunction/imagesMove";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 2;
const BLOCKED_IPV4_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function imageError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function ipv4Number(address) {
  return address
    .split(".")
    .reduce((value, part) => (value << 8) | Number(part), 0) >>> 0;
}

function isPublicIpv4(address) {
  if (isIP(address) !== 4) return false;
  const value = ipv4Number(address);
  return !BLOCKED_IPV4_RANGES.some(([network, prefix]) => {
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) === (ipv4Number(network) & mask);
  });
}

function parseRemoteImageUrl(value) {
  let url;
  try {
    url = new URL(String(value ?? "").trim());
  } catch {
    throw imageError("La URL de imagen no es válida.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port &&
      !(
        (url.protocol === "https:" && url.port === "443") ||
        (url.protocol === "http:" && url.port === "80")
      ))
  ) {
    throw imageError("Usa una URL pública de imagen HTTP o HTTPS.");
  }
  if (isIP(url.hostname) === 6) {
    throw imageError("La URL de imagen no puede apuntar a una dirección privada.");
  }
  return url;
}

async function resolvePublicIpv4(hostname) {
  if (isIP(hostname) === 4) {
    if (!isPublicIpv4(hostname)) {
      throw imageError("La URL de imagen no puede apuntar a una dirección privada.");
    }
    return hostname;
  }

  let addresses;
  try {
    addresses = await lookup(hostname, {
      all: true,
      family: 4,
      verbatim: true,
    });
  } catch {
    throw imageError("No se pudo verificar el servidor de imágenes.", 502);
  }
  if (!addresses.length || addresses.some(({ address }) => !isPublicIpv4(address))) {
    throw imageError(
      "No se pudo verificar que el servidor de imágenes sea público.",
    );
  }
  return addresses[0].address;
}

function downloadImage(url, address, redirectsRemaining) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.get(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        headers: { "User-Agent": "RouMenu-ImageImporter/1.0" },
        timeout: REQUEST_TIMEOUT_MS,
        lookup: (_hostname, _options, callback) => callback(null, address, 4),
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          const location = response.headers.location;
          response.resume();
          if (!location || redirectsRemaining <= 0) {
            reject(
              imageError(
                "La URL de imagen excede los redireccionamientos permitidos.",
              ),
            );
            return;
          }
          let nextUrl;
          try {
            nextUrl = parseRemoteImageUrl(new URL(location, url).toString());
          } catch (error) {
            reject(error);
            return;
          }
          resolve(downloadAndValidateImage(nextUrl, redirectsRemaining - 1));
          return;
        }

        if (status !== 200) {
          response.resume();
          reject(
            imageError("No se pudo descargar la imagen desde esa URL.", 502),
          );
          return;
        }

        const contentType = (response.headers["content-type"] ?? "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        const contentLength = Number(response.headers["content-length"] ?? 0);
        if (
          !contentType.startsWith("image/") ||
          contentType === "image/svg+xml" ||
          (contentLength > 0 && contentLength > MAX_IMAGE_BYTES)
        ) {
          response.resume();
          reject(
            imageError(
              "La URL no apunta a una imagen compatible de hasta 10 MB.",
            ),
          );
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        response.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_IMAGE_BYTES) {
            request.destroy(new Error("La imagen supera el límite de 10 MB."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            blob: new Blob([Buffer.concat(chunks)], { type: contentType }),
            contentType,
          });
        });
        response.on("error", reject);
      },
    );

    request.on("timeout", () =>
      request.destroy(
        imageError("La descarga de la imagen tardó demasiado.", 502),
      ),
    );
    request.on("error", (error) =>
      reject(error.status ? error : imageError("No se pudo descargar la imagen.", 502)),
    );
  });
}

async function downloadAndValidateImage(url, redirectsRemaining) {
  const address = await resolvePublicIpv4(url.hostname);
  return downloadImage(url, address, redirectsRemaining);
}

export async function uploadRemoteImage(url) {
  const parsedUrl = parseRemoteImageUrl(url);
  const { blob } = await downloadAndValidateImage(parsedUrl, MAX_REDIRECTS);
  const result = await UploadNewImage(blob);
  if (!result?.secure_url) {
    throw imageError("No se pudo guardar la imagen en RouMenu.", 500);
  }
  return result.secure_url;
}

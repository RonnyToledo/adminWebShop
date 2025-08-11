/**
 * Extrae y convierte blob:/data:/http URLs y objetos relacionados en File objects reales.
 *
 * @param {Array} arr - Array de valores (File|Blob|string|object).
 * @param {Object} [opts]
 * @param {string} [opts.filenamePrefix='image'] - Prefijo para el nombre de archivo generado.
 * @param {boolean} [opts.revokeObjectURL=false] - Si true, revoca object URLs después de crear el File.
 * @returns {Promise<Array<{index: number, file: File, previewUrl?: string}>>}
 */
export async function extractBlobFilesFromArray(arr, opts = {}) {
  const { filenamePrefix = "image", revokeObjectURL = false } = opts;
  if (!Array.isArray(arr))
    throw new TypeError("Se espera un array como primer argumento.");

  const makeFilename = (index, ext = "png") =>
    `${filenamePrefix}_${index}_${Date.now()}.${ext}`;

  const fileFromBlob = (blob, index, suggestedName) => {
    const ext = (blob.type && blob.type.split("/")[1]) || "png";
    const filename = suggestedName || makeFilename(index, ext);
    // crear File garantizado
    return new File([blob], filename, {
      type: blob.type || "image/png",
      lastModified: Date.now(),
    });
  };

  const fetchToBlob = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error fetch ${url} (status ${res.status})`);
    return await res.blob();
  };

  const parseDataUrlToBlob = (dataUrl) => {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) throw new Error("Data URL inválida");
    const meta = dataUrl.substring(5, comma); // "image/png;base64" o "image/png"
    const isBase64 = meta.includes(";base64");
    const mime = meta.split(";")[0] || "image/png";
    const dataStr = dataUrl.substring(comma + 1);
    let byteString;
    if (isBase64) {
      byteString = atob(dataStr);
    } else {
      byteString = decodeURIComponent(dataStr);
    }
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++)
      ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mime });
  };

  const tasks = arr.map(async (val, idx) => {
    try {
      // 1) Si ya es File -> pase directo
      if (val instanceof File) {
        return { index: idx, file: val, previewUrl: val.previewUrl || null };
      }

      // 2) Si es Blob (pero no File)
      if (val instanceof Blob) {
        const file = fileFromBlob(val, idx, val.name);
        return { index: idx, file, previewUrl: null };
      }

      // 3) Si es string -> blob:, data:, http(s):
      if (typeof val === "string") {
        const url = val;
        if (url.startsWith("data:")) {
          const blob = parseDataUrlToBlob(url);
          const file = fileFromBlob(blob, idx);
          return { index: idx, file, previewUrl: url };
        }
        if (url.startsWith("blob:")) {
          const blob = await fetchToBlob(url);
          const file = fileFromBlob(blob, idx);
          if (revokeObjectURL && url.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(url);
            } catch (_) {}
          }
          return { index: idx, file, previewUrl: url };
        }
        // strings no soportadas -> skip
        throw new Error(
          "String no soportada (esperado blob:, data:, http(s):)"
        );
      }

      // 4) Si es un objeto (p.ej. { file, previewUrl, name, type, ... })
      if (val && typeof val === "object") {
        // si trae .file que sea File/Blob/POJO
        const candidate = val.file ?? val; // en algunos flujos el objeto entero es el "file-like"
        // a) candidate ya file
        if (candidate instanceof File)
          return {
            index: idx,
            file: candidate,
            previewUrl: val.previewUrl ?? null,
          };
        // b) candidate Blob
        if (candidate instanceof Blob) {
          const file = fileFromBlob(candidate, idx, candidate.name || val.name);
          return { index: idx, file, previewUrl: val.previewUrl ?? null };
        }
        // c) candidate es objeto plano (p.ej. resultado serializado con name/type/size)
        if (
          typeof candidate === "object" &&
          (candidate.name || candidate.type || candidate.size)
        ) {
          // intentamos reconstruir usando previewUrl si hay
          const url = val.previewUrl || candidate.previewUrl || candidate.url;
          if (!url)
            throw new Error(
              "Objeto file-like sin previewUrl para reconstruir bytes."
            );
          // soportar data:/blob:/http:
          if (url.startsWith("data:")) {
            const blob = parseDataUrlToBlob(url);
            const file = fileFromBlob(blob, idx, candidate.name);
            return { index: idx, file, previewUrl: url };
          }
          if (
            url.startsWith("blob:") ||
            url.startsWith("http://") ||
            url.startsWith("https://")
          ) {
            const blob = await fetchToBlob(url);
            const file = fileFromBlob(blob, idx, candidate.name || val.name);
            if (revokeObjectURL && url.startsWith("blob:")) {
              try {
                URL.revokeObjectURL(url);
              } catch (_) {}
            }
            return { index: idx, file, previewUrl: url };
          }
          throw new Error("PreviewUrl no soportada para reconstruir file.");
        }

        throw new Error("Objeto no reconoce formato para extraer File.");
      }

      throw new Error("Tipo de entrada no válido para index " + idx);
    } catch (err) {
      // devolvemos error para este índice (no rompe otras tareas)
      return {
        index: idx,
        error: err instanceof Error ? err.message : String(err),
        previewUrl:
          (val && val.previewUrl) || (typeof val === "string" ? val : null),
      };
    }
  });

  const settled = await Promise.all(tasks);
  // Filtramos sólo resultados válidos (con .file)
  return settled
    .filter((r) => r && r.file)
    .map(({ index, file, previewUrl }) => ({ index, file, previewUrl }));
}

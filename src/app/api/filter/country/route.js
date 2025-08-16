// app/api/filter/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

export async function GET(req) {
  const url = new URL(req.url);
  // Opcional: ?limit=100 para devolver solo los primeros 100 resultados
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.max(0, parseInt(limitParam, 10) || 0) : 0;

  const filePath = path.join(process.cwd(), "public", "country.json");

  return new Promise((resolve) => {
    const resultados = [];
    let count = 0;
    let finished = false;

    const pipeline = chain([
      fs.createReadStream(filePath, { encoding: "utf8" }),
      parser(),
      streamArray(),
    ]);

    pipeline.on("data", (chunk) => {
      // chunk.value es el objeto cuando el JSON raíz es un array de objetos
      const obj = chunk.value;
      if (!obj || typeof obj !== "object") return;

      // intentamos mapear distintos nombres posibles por si varía la estructura
      const name = obj.name ?? obj.Name ?? obj.country ?? null;
      const isoCode = obj.isoCode ?? obj.iso_code ?? obj.code ?? null;

      if (name !== null && isoCode !== null) {
        resultados.push({ name, isoCode });
        count += 1;
      }

      // si hay límite y lo alcanzamos, detenemos el stream y resolvemos
      if (limit > 0 && count >= limit && !finished) {
        finished = true;
        // destruir el pipeline (cierra el stream)
        try {
          pipeline.destroy();
        } catch (e) {}
        return resolve(NextResponse.json(resultados));
      }
    });

    pipeline.on("end", () => {
      if (finished) return;
      finished = true;
      resolve(NextResponse.json(resultados));
    });

    pipeline.on("error", (err) => {
      if (finished) return;
      finished = true;
      console.error("Error parseando JSON:", err);
      resolve(
        NextResponse.json(
          { error: "Error leyendo el archivo", details: String(err) },
          { status: 500 }
        )
      );
    });
  });
}

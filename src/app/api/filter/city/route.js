// app/api/filter/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const country = (url.searchParams.get("country") || "").toUpperCase();
    const state = (url.searchParams.get("state") || "").toUpperCase();
    const limit = Math.max(
      0,
      parseInt(url.searchParams.get("limit") || "0", 10) || 0
    );

    if (!country || !state) {
      return NextResponse.json(
        { error: "Faltan query params 'country' y/o 'state'." },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "public", "city.json");

    return new Promise((resolve) => {
      const resultados = [];
      const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
      const pipeline = chain([fileStream, parser(), streamArray()]);

      // cuando llegues al limit, destruimos el stream para parar la lectura
      pipeline.on("data", (chunk) => {
        const item = chunk.value;
        if (!Array.isArray(item)) return;

        const cc = String(item[1] || "").toUpperCase();
        const st = String(item[2] || "").toUpperCase();

        if (cc === country && st === state) {
          resultados.push(item);
          if (limit && resultados.length >= limit) {
            // corta la lectura
            try {
              pipeline.destroy();
              fileStream.destroy();
            } catch (e) {
              /* noop */
            }
          }
        }
      });

      const finish = () =>
        resolve(NextResponse.json(resultados.map((obj) => obj[0])));

      // 'end' se dispara al terminar normal; 'close' puede dispararse si destruimos el stream
      pipeline.on("end", finish);
      pipeline.on("close", finish);

      pipeline.on("error", (err) => {
        console.error("Error parseando JSON:", err);
        resolve(
          NextResponse.json(
            { error: "Error leyendo el archivo" },
            { status: 500 }
          )
        );
      });

      fileStream.on("error", (err) => {
        console.error("Error abriendo archivo:", err);
        resolve(
          NextResponse.json(
            { error: "Error abriendo el archivo" },
            { status: 500 }
          )
        );
      });
    });
  } catch (err) {
    console.error("Error en handler GET:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

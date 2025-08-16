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
    const countryParam = url.searchParams.get("country") || "";
    const country = countryParam.toUpperCase();

    if (!country) {
      return NextResponse.json(
        { error: "Falta query param 'country'." },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "public", "state.json");

    // Si necesitas un límite (p. ej. ?limit=100) puedes recogerlo así:
    // const limit = parseInt(url.searchParams.get("limit") || "0", 10) || 0;

    return new Promise((resolve) => {
      const resultados = [];
      const pipeline = chain([
        fs.createReadStream(filePath, { encoding: "utf8" }),
        parser(),
        streamArray(),
      ]);

      pipeline.on("data", (chunk) => {
        const item = chunk.value;
        if (item && typeof item === "object") {
          const cc = (item.countryCode || "").toUpperCase();
          if (cc === country) {
            resultados.push(item);
            // Si usas limit, puedes destruir el stream cuando ya tengas suficientes:
            // if (limit && resultados.length >= limit) {
            //   pipeline.destroy(); // esto disparará 'end' o 'close'
            // }
          }
        }
      });

      pipeline.on("end", () => {
        resolve(
          NextResponse.json(
            resultados.map((r) => ({ isoCode: r.isoCode, name: r.name }))
          )
        );
      });

      pipeline.on("error", (err) => {
        console.error("Error parseando JSON:", err);
        resolve(
          NextResponse.json(
            { error: "Error leyendo el archivo" },
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

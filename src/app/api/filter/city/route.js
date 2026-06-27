// app/api/filter/city/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

let cityCache = null; // se parsea una sola vez

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const country = (url.searchParams.get("country") || "").toUpperCase();
    const state = (url.searchParams.get("state") || "").toUpperCase();
    const limit = parseInt(url.searchParams.get("limit") || "0", 10) || 0;

    if (!country || !state) {
      return NextResponse.json(
        { error: "Faltan query params 'country' y/o 'state'." },
        { status: 400 },
      );
    }

    // Cargar y cachear solo la primera vez
    if (!cityCache) {
      const filePath = path.join(process.cwd(), "public", "city.json");
      const raw = await fs.readFile(filePath, "utf8");
      cityCache = JSON.parse(raw);
    }

    let results = cityCache
      .filter((item) => {
        const cc = String(item[1] || "").toUpperCase();
        const st = String(item[2] || "").toUpperCase();
        return cc === country && st === state;
      })
      .map((item) => ({
        name: item[0],
        lat: parseFloat(item[3]),
        lng: parseFloat(item[4]),
      }));

    if (limit > 0) results = results.slice(0, limit);

    return NextResponse.json(results);
  } catch (err) {
    console.error("Error en GET /api/filter/city:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

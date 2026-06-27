// app/api/filter/state/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

let stateCache = null; // cache en memoria entre requests

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const country = (url.searchParams.get("country") || "").toUpperCase();

    if (!country) {
      return NextResponse.json(
        { error: "Falta query param 'country'." },
        { status: 400 },
      );
    }

    // Cargar y cachear el archivo solo una vez
    if (!stateCache) {
      const filePath = path.join(process.cwd(), "public", "state.json");
      const raw = await fs.readFile(filePath, "utf8");
      stateCache = JSON.parse(raw);
    }

    const results = stateCache
      .filter((s) => (s.countryCode || "").toUpperCase() === country)
      .map((s) => ({ isoCode: s.isoCode, name: s.name }));

    return NextResponse.json(results);
  } catch (err) {
    console.error("Error en GET /api/filter/state:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

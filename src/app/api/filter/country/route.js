// app/api/filter/country/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "0", 10) || 0;

    const filePath = path.join(process.cwd(), "public", "country.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    const countries = parsed
      .map((obj) => ({
        name: obj.name ?? obj.Name ?? null,
        isoCode: obj.isoCode ?? obj.iso_code ?? obj.code ?? null,
      }))
      .filter((c) => c.name && c.isoCode);

    return NextResponse.json(limit > 0 ? countries.slice(0, limit) : countries);
  } catch (err) {
    console.error("Error en GET /api/filter/country:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

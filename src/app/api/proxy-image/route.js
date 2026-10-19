// src/app/api/proxy-image/route.js
import { NextResponse } from "next/server";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB, igual al límite que ya anuncia la UI

export async function POST(request) {
  let url;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ message: "Body inválido" }, { status: 400 });
  }

  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ message: "URL inválida" }, { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetch(url, {
      // Server-to-server: no aplica CORS acá, solo restricciones propias del
      // servidor de origen (bloqueo por user-agent, hotlink protection, etc.)
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)" },
    });
  } catch (err) {
    return NextResponse.json(
      { message: "No se pudo descargar la imagen desde esa URL" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: `El origen respondió ${upstream.status}` },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { message: "La URL no apunta a una imagen válida" },
      { status: 415 },
    );
  }

  const contentLength = Number(upstream.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) {
    return NextResponse.json(
      { message: "La imagen supera el límite de 10MB" },
      { status: 413 },
    );
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { message: "La imagen supera el límite de 10MB" },
      { status: 413 },
    );
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

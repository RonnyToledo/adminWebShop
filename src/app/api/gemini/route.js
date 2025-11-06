// app/api/gemini/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:4000";
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    // Solo server-side: asegúrate de no exponer GEMINI_API_KEY al cliente
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY on server" },
        { status: 500, headers: corsHeaders }
      );
    }

    const formData = await req.formData();
    const textRaw = formData.get("text");
    const text = (
      typeof textRaw === "string" ? textRaw : String(textRaw ?? "")
    ).trim();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // El SDK suele aceptar la API key via env var o al crear el cliente.
    const ai = new GoogleGenAI({ apiKey }); // explícito = seguro
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      // config: { temperature: 0.7, candidateCount: 1 } // opcional
    });

    // Manejo defensivo del resultado (según versiones del SDK)
    const resultText =
      response?.text ??
      // algunas versiones devuelven structure más compleja
      response?.output?.[0]?.content?.[0]?.text ??
      JSON.stringify(response);

    return NextResponse.json(
      { result: resultText },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}

// app/api/gemini/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const ORIGIN = process.env.NEXT_PUBLIC_PATH ?? "http://localhost:4001";

const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ✅ Cliente singleton — se crea una vez, no en cada request
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorResponse(message, status) {
  return NextResponse.json(
    { error: message },
    { status, headers: corsHeaders },
  );
}

function extractText(response) {
  if (!response || typeof response !== "object") return "";
  const r = response;

  return (
    r.text ?? r.output?.[0]?.content?.[0]?.text ?? JSON.stringify(response)
  );
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  if (!ai) return errorResponse("Missing GEMINI_API_KEY on server", 500);

  // Valida Content-Type antes de parsear
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
    return errorResponse("Expected multipart/form-data", 415);
  }

  let text;

  try {
    const formData = await req.formData();
    const raw = formData.get("text");
    text = (typeof raw === "string" ? raw : String(raw ?? "")).trim();
  } catch {
    return errorResponse("Invalid form data", 400);
  }

  if (!text) return errorResponse("No text provided", 400);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
    });

    return NextResponse.json(
      { result: extractText(response) },
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Gemini]", message);
    return errorResponse(message, 502); // 502 = fallo upstream, no nuestro
  }
}

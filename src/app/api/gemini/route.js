import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { IA } from "@/components/Chadcn-components/blog/IA";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY });

export async function POST(req) {
  try {
    const formData = await req.formData();
    const text = formData.get("text"); // <-- aquí recibes el File/Blob

    if (!text) return NextResponse.json({ error: "No Text" }, { status: 400 });
    // subir a Cloudinary vía upload_stream

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${IA}
       ${text} `,
    });
    console.log(response.text);
    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

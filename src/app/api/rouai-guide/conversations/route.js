import { NextResponse } from "next/server";
import { getRouAIGuideAccess } from "@/lib/rouai-guide/server";

export async function GET() {
  const access = await getRouAIGuideAccess();
  if (access.response) return access.response;

  const { data, error } = await access.supabase
    .from("rouai_guide_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", access.user.id)
    .eq("store_id", access.store.UUID)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("RouAI Guide conversations could not be loaded:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el historial de chats." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { conversations: data ?? [] },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

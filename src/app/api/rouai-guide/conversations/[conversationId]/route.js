import { NextResponse } from "next/server";
import {
  getRouAIGuideAccess,
  isValidConversationId,
  validateSameOrigin,
} from "@/lib/rouai-guide/server";

export async function GET(_request, { params }) {
  const { conversationId } = await params;
  if (!isValidConversationId(conversationId)) {
    return NextResponse.json({ error: "Chat invalido." }, { status: 400 });
  }

  const access = await getRouAIGuideAccess();
  if (access.response) return access.response;

  const { data: conversation, error: conversationError } = await access.supabase
    .from("rouai_guide_conversations")
    .select("id, title, created_at, updated_at")
    .eq("id", conversationId)
    .eq("user_id", access.user.id)
    .eq("store_id", access.store.UUID)
    .maybeSingle();

  if (conversationError) {
    console.error(
      "RouAI Guide conversation could not be loaded:",
      conversationError,
    );
    return NextResponse.json(
      { error: "No se pudo cargar este chat." },
      { status: 500 },
    );
  }
  if (!conversation) {
    return NextResponse.json(
      { error: "No se encontró este chat." },
      { status: 404 },
    );
  }

  const { data: messages, error: messagesError } = await access.supabase
    .from("rouai_guide_messages")
    .select("id, role, content, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (messagesError) {
    console.error("RouAI Guide messages could not be loaded:", messagesError);
    return NextResponse.json(
      { error: "No se pudieron cargar los mensajes de este chat." },
      { status: 500 },
    );
  }

  const proposalKeys = (messages ?? [])
    .map((message) => message.metadata)
    .filter((metadata) => metadata?.type === "action_proposal")
    .map((metadata) => metadata.requestKey)
    .filter((key) => typeof key === "string");

  let actionStates = [];
  if (proposalKeys.length > 0) {
    const { data: states, error: statesError } = await access.supabase
      .from("rouai_guide_action_requests")
      .select("request_key, status, result")
      .eq("user_id", access.user.id)
      .eq("store_id", access.store.UUID)
      .in("request_key", proposalKeys);

    if (statesError) {
      console.error(
        "RouAI Guide action statuses could not be loaded:",
        statesError,
      );
      return NextResponse.json(
        { error: "No se pudo cargar el estado de las acciones de este chat." },
        { status: 500 },
      );
    }
    actionStates = states ?? [];
  }

  const statesByKey = new Map(
    actionStates.map((state) => [state.request_key, state]),
  );
  const messagesWithActionStatus = (messages ?? []).map((message) => {
    const metadata = message.metadata;
    if (metadata?.type !== "action_proposal") return message;
    const state = statesByKey.get(metadata.requestKey);
    if (!state) return message;

    return {
      ...message,
      metadata: {
        ...metadata,
        status: state.status,
        executionResult:
          state.status === "completed" ? (state.result?.entity ?? null) : null,
        executionError:
          state.status === "failed" ? (state.result?.error ?? null) : null,
      },
    };
  });

  return NextResponse.json(
    { conversation, messages: messagesWithActionStatus.reverse() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function DELETE(request, { params }) {
  const { conversationId } = await params;
  if (!isValidConversationId(conversationId)) {
    return NextResponse.json({ error: "Chat inválido." }, { status: 400 });
  }
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  }

  const access = await getRouAIGuideAccess();
  if (access.response) return access.response;

  const { data, error } = await access.supabase
    .from("rouai_guide_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", access.user.id)
    .eq("store_id", access.store.UUID)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("RouAI Guide conversation could not be deleted:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar este chat." },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "No se encontró este chat." },
      { status: 404 },
    );
  }

  return NextResponse.json({ deleted: true });
}

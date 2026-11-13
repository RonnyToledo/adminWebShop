import { NextResponse } from "next/server";
import { getRouteUser } from "@/lib/route-handler-auth";

export function getRouAIGuidePlanMode(store) {
  const plan = String(store?.plan ?? "")
    .trim()
    .toLowerCase();
  if (store?.plan_vence) {
    const expiration = Date.parse(store.plan_vence);
    if (!Number.isFinite(expiration) || expiration < Date.now()) {
      return "disabled";
    }
  }
  if (plan === "pro") return "informational";
  if (plan === "anual") return "advanced";
  return "disabled";
}

export async function getRouAIGuideAccess({ allowDisabledPlan = false } = {}) {
  const { supabase, user, error } = await getRouteUser();
  if (error) {
    const errorCode = error.code?.toLowerCase?.() ?? "";
    const errorMessage = error.message?.toLowerCase?.() ?? "";
    const isUnauthenticated =
      ["bad_jwt", "session_not_found", "refresh_token_not_found"].includes(
        errorCode,
      ) ||
      errorMessage.includes("auth session missing") ||
      errorMessage.includes("invalid jwt") ||
      errorMessage.includes("jwt expired");

    if (isUnauthenticated) {
      return {
        response: NextResponse.json(
          { error: "Inicia sesión para utilizar RouAI Guide." },
          { status: 401 },
        ),
      };
    }

    console.error("RouAI Guide could not verify the authenticated session:", error);
    return {
      response: NextResponse.json(
        { error: "No se pudo verificar tu sesión. Inténtalo de nuevo." },
        { status: 503 },
      ),
    };
  }
  if (!user || !supabase) {
    return {
      response: NextResponse.json(
        { error: "Inicia sesión para utilizar RouAI Guide." },
        { status: 401 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("store_members")
    .select("store_id, store_role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (membershipError) {
    console.error("RouAI Guide could not verify store membership:", membershipError);
    return {
      response: NextResponse.json(
        { error: "No se pudo verificar el acceso al negocio." },
        { status: 500 },
      ),
    };
  }

  let storeId = membership?.store_id ?? null;
  let storeRole = membership?.store_role ?? null;

  if (!storeId) {
    const { data: legacyStore, error: legacyError } = await supabase
      .from("Sitios")
      .select("UUID")
      .eq("Editor", user.id)
      .maybeSingle();

    if (legacyError) {
      console.error("RouAI Guide could not verify legacy store ownership:", legacyError);
      return {
        response: NextResponse.json(
          { error: "No se pudo verificar el acceso al negocio." },
          { status: 500 },
        ),
      };
    }

    storeId = legacyStore?.UUID ?? null;
    if (storeId) storeRole = "owner";
  }

  if (!storeId || !storeRole) {
    return {
      response: NextResponse.json(
        { error: "Tu cuenta no tiene acceso activo a un negocio." },
        { status: 403 },
      ),
    };
  }

  const { data: store, error: storeError } = await supabase
    .from("Sitios")
    .select("UUID, name, plan, plan_vence, sitioweb, stocks, banner, urlPoster, monedas(id, defecto)")
    .eq("UUID", storeId)
    .maybeSingle();

  if (storeError || !store) {
    if (storeError) {
      console.error("RouAI Guide could not load the active store:", storeError);
    }
    return {
      response: NextResponse.json(
        { error: "No se encontró el negocio activo de esta cuenta." },
        { status: storeError ? 500 : 403 },
      ),
    };
  }

  const guideMode = getRouAIGuidePlanMode(store);
  if (guideMode === "disabled" && !allowDisabledPlan) {
    return {
      response: NextResponse.json(
        {
          error:
            "RouAI está disponible en los planes Pro y Anual. Actualiza tu plan para usar el asistente.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    user,
    store,
    storeRole,
    guideMode,
    response: null,
  };
}

export function isValidConversationId(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function getSafeReturnPath(value) {
  if (typeof value !== "string" || value.length > 300) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/rouai-guide")) return "/";
  return value;
}

export function validateSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch (error) {
    console.error("RouAI Guide received an invalid Origin header:", error);
    return false;
  }
}

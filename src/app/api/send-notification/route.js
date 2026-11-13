// @/app/api/send-notification
import { NextResponse } from "next/server";
import { getRouteUser } from "@/lib/route-handler-auth";
import { getAdminClient } from "@/lib/server/push-notifications";
import webpush from "web-push";

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(req) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const { supabase, user, error: authError } = await getRouteUser();

    if (authError || !user || !supabase) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("user")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error("Error verificando el rol:", accountError);
      return NextResponse.json(
        { error: "Unable to verify permissions" },
        { status: 503 }
      );
    }

    const payload = await req.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const targetUserId =
      typeof payload.userId === "string" ? payload.userId : user.id;
    const isBroadcast = payload.broadcast === true;
    const isPlatformAdmin = account?.role === "admin";

    if ((isBroadcast || targetUserId !== user.id) && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "Only platform administrators can target other users" },
        { status: 403 }
      );
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: "Web Push server keys are not configured" },
        { status: 503 }
      );
    }

    webpush.setVapidDetails("mailto:noreply@roumenu.com", publicKey, privateKey);

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const message =
      typeof payload.message === "string" ? payload.message.trim() : "";
    if (!title || !message || title.length > 120 || message.length > 2000) {
      return NextResponse.json(
        { error: "A valid title and message are required" },
        { status: 400 }
      );
    }

    const pushSupabase = getAdminClient();
    let query = pushSupabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth");
    if (isBroadcast) query = query.not("endpoint", "is", null);
    else query = query.eq("user_id", targetUserId);

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Error obteniendo suscripciones:", error);
      return NextResponse.json(
        { error: "Notification subscriptions are unavailable" },
        { status: 503 }
      );
    }

    const recipients = subscriptions ?? [];
    const link =
      typeof payload.link === "string" &&
      payload.link.startsWith("/") &&
      !payload.link.startsWith("//")
        ? payload.link
        : "/notifications";
    const results = await Promise.allSettled(
      recipients.map(({ endpoint, p256dh, auth }) =>
        webpush.sendNotification(
          { endpoint, keys: { p256dh, auth } },
          JSON.stringify({
            title,
            body: message,
            tag: `admin-notification-${Date.now()}`,
            data: { link },
          }),
        ),
      ),
    );

    const sent = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - sent;
    const expiredEndpoints = results.flatMap((result, index) => {
      if (result.status !== "rejected") return [];
      return [404, 410].includes(result.reason?.statusCode)
        ? [recipients[index].endpoint]
        : [];
    });

    if (expiredEndpoints.length) {
      let cleanupQuery = pushSupabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
      if (!isBroadcast) cleanupQuery = cleanupQuery.eq("user_id", targetUserId);
      const { error: cleanupError } = await cleanupQuery;
      if (cleanupError) {
        console.error("Error limpiando suscripciones expiradas:", cleanupError);
      }
    }

    return NextResponse.json(
      { success: failed === 0, sent, failed },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error enviando notificaciones:", err);
    return NextResponse.json(
      { error: "Unable to send notifications" },
      { status: 502 }
    );
  }
}
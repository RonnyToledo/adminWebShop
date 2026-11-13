import { NextResponse } from "next/server";
import { getRouteUser } from "@/lib/route-handler-auth";

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function validEndpoint(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      [
        "fcm.googleapis.com",
        "push.services.mozilla.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const { supabase, user, error: authError } = await getRouteUser();
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const subscription = await request.json();
    if (
      !validEndpoint(subscription?.endpoint) ||
      typeof subscription?.keys?.p256dh !== "string" ||
      typeof subscription?.keys?.auth !== "string" ||
      subscription.keys.p256dh.length > 256 ||
      subscription.keys.auth.length > 256
    ) {
      return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        shop_key: null,
        subscription,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      console.error("[push-subscription] Save failed:", error);
      return NextResponse.json(
        { error: "Unable to save push subscription" },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push-subscription] Request failed:", error);
    return NextResponse.json({ error: "Unable to process subscription" }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const { supabase, user, error: authError } = await getRouteUser();
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!validEndpoint(body?.endpoint)) {
      return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 });
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint)
      .eq("user_id", user.id);

    if (error) {
      console.error("[push-subscription] Delete failed:", error);
      return NextResponse.json(
        { error: "Unable to remove push subscription" },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push-subscription] Request failed:", error);
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}

// lib/server-auth.js (añadir helper)
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function restoreSessionFromCookie() {
  try {
    const cookieStore = await cookies(); // <- await importante
    const cookie = cookieStore.get("sb-access-token");
    if (!cookie) return { ok: false, error: "No session cookie" };

    let parsed;
    try {
      parsed = JSON.parse(cookie.value);
    } catch (e) {
      return { ok: false, error: "Invalid cookie value" };
    }

    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { error: setErr } = await supabase.auth.setSession({
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    });

    if (setErr) return { ok: false, error: setErr.message || setErr };

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return { ok: true, user: null, warning: userErr.message };

    return { ok: true, user };
  } catch (err) {
    console.error("restoreSessionFromCookie:", err);
    return { ok: false, error: "internal error" };
  }
}

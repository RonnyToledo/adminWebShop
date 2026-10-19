import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const SAFE_ORIGINS = [
  "http://localhost:4001",
  "http://localhost:3000",
  "https://adminwebshop.vercel.app",
  "https://www.adminwebshop.vercel.app",
];

function isSafeRedirect(value) {
  if (!value || value.startsWith("//")) return "/";

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const url = new URL(value);
    const isAllowedOrigin = SAFE_ORIGINS.includes(url.origin);
    return isAllowedOrigin ? url.pathname + url.search : "/";
  } catch {
    return "/";
  }
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = isSafeRedirect(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=oauth", requestUrl.origin),
    );
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "[auth/callback] Error intercambiando código:",
      error.message,
    );
    return NextResponse.redirect(
      new URL("/login?error=oauth", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient = null;
let serverClient = null;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars are not configured.");
  }

  if (typeof window === "undefined") {
    if (!serverClient) {
      serverClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    }
    return serverClient;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

export const supabase = createClient();

import "server-only";

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

let adminClient;

export function getAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return adminClient;
}

export async function sendPushToUser(userId, { title, body, link = "/" }) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("[push-notifications] VAPID server keys are not configured");
    return { sent: 0, failed: 0, configured: false };
  }

  try {
    webpush.setVapidDetails("mailto:noreply@roumenu.com", publicKey, privateKey);
    const supabase = getAdminClient();
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId);

    if (error) throw error;
    if (!subscriptions?.length) return { sent: 0, failed: 0, configured: true };

    const payload = JSON.stringify({
      title,
      body,
      tag: `user-notification-${Date.now()}`,
      data: { link },
    });
    const results = await Promise.allSettled(
      subscriptions.map(({ endpoint, p256dh, auth }) =>
        webpush.sendNotification(
          { endpoint, keys: { p256dh, auth } },
          payload,
        ),
      ),
    );
    const sent = results.filter((result) => result.status === "fulfilled").length;
    const expiredEndpoints = results.flatMap((result, index) => {
      if (result.status !== "rejected") return [];
      const code = result.reason?.statusCode;
      return code === 404 || code === 410 ? [subscriptions[index].endpoint] : [];
    });

    if (expiredEndpoints.length) {
      const { error: cleanupError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .in("endpoint", expiredEndpoints);
      if (cleanupError) {
        console.error("[push-notifications] Expired subscription cleanup failed:", cleanupError);
      }
    }

    const failed = results.length - sent;
    if (failed) {
      console.error(`[push-notifications] Delivery failed for ${failed} subscription(s)`);
    }
    return { sent, failed, configured: true };
  } catch (error) {
    console.error("[push-notifications] Delivery failed:", error);
    return { sent: 0, failed: 1, configured: true };
  }
}

import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const private_key = process.env.GOOGLE_PRIVATE_KEY;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;

if (!private_key || !client_email) {
  throw new Error("Google Analytics credentials are not configured.");
}

export const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email,
    private_key: private_key,
  },
});

import { BetaAnalyticsDataClient } from "@google-analytics/data";

const private_key = process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY;

export const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.NEXT_PUBLIC_CLIENT_EMAIL,
    private_key: private_key,
  },
});

// app/notifications/page.jsx
import NotificationsPage from "@/components/Chadcn-components/Notifications/Notifications";
import { getServerUser } from "@/lib/server-auth";

export default async function Page() {
  const user = await getServerUser();
  return <NotificationsPage userId={user?.userId} />;
}

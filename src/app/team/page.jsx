// app/team/page.jsx
import { getServerUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { fetchStoreAccessData } from "@/lib/supabaseApi";
import TeamPage from "@/components/Chadcn-components/Team/TeamPage";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function page() {
  const userData = await getServerUser();
  if (!userData?.userId) redirect("/login");

  const { data } = await fetchStoreAccessData(userData.userId);
  const storeRole = data?.store_role;

  if (!["owner", "admin"].includes(storeRole)) redirect("/");

  // Verificar si es admin global
  let isGlobalAdmin = false;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { data: userRole } = await supabase
      .from("user")
      .select("role")
      .eq("id", userData.userId)
      .maybeSingle();

    isGlobalAdmin = userRole?.role === "admin";
  } catch (err) {
    console.error("Error checking global admin:", err.message);
  }

  return (
    <TeamPage
      storeId={data?.store_id}
      currentUserId={userData.userId}
      storeRole={storeRole}
      isGlobalAdmin={isGlobalAdmin}
    />
  );
}

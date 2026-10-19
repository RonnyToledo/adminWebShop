import React from "react";
import { ThemeContext } from "@/context/useContext";
import Theme from "@/components/Chadcn-components/Theme/theme";
import { fetchThemeData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchThemeData(user.userId)
    : { data: null };
  return <Theme ThemeContext={ThemeContext} initialData={result.data} />;
}

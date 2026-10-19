import React from "react";
import { ThemeContext } from "@/context/useContext";
import Category from "@/components/Chadcn-components/Category/Category";
import { fetchCategoryData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const userData = await getServerUser();
  const result = userData?.userId
    ? await fetchCategoryData(userData.userId)
    : { data: null };

  return <Category ThemeContext={ThemeContext} initialData={result.data} />;
}

import React from "react";
import { ThemeContext } from "@/context/useContext";
import EditCategory from "@/components/Chadcn-components/Category/EditCategory";
import { fetchCategorySpecificData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page({ params }) {
  const uid = (await params).uid;
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchCategorySpecificData(user.userId, uid)
    : { data: null };
  return (
    <EditCategory
      ThemeContext={ThemeContext}
      uid={uid}
      initialData={result.data}
    />
  );
}

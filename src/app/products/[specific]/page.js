import React from "react";
import { ThemeContext } from "@/context/useContext";
import Specific from "@/components/Chadcn-components/Specific/Specific";
import { fetchProductSpecificData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page({ params }) {
  const specific = (await params).specific;
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchProductSpecificData(user.userId, specific)
    : { data: null };
  return (
    <Specific
      ThemeContext={ThemeContext}
      specific={specific}
      initialData={result.data}
    />
  );
}

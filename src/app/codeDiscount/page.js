import React from "react";
import { ThemeContext } from "@/context/useContext";
import { Marketing } from "@/components/Chadcn-components/codeDiscount/marketing";
import { fetchDiscountData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchDiscountData(user.userId)
    : { data: null };
  return <Marketing ThemeContext={ThemeContext} initialData={result.data} />;
}

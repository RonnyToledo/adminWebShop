import React from "react";
import GeneralProducts from "@/components/Chadcn-components/Products/GeneralProducts";
import { fetchProductsData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchProductsData(user.userId)
    : { data: null };
  return <GeneralProducts initialData={result.data} />;
}

import React from "react";
import NewProduct from "@/components/Chadcn-components/NewProduct/NewProduct";
import { fetchNewProductData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchNewProductData(user.userId)
    : { data: null };
  return <NewProduct initialData={result.data} />;
}

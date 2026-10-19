import React from "react";
import { ThemeContext } from "@/context/useContext";
import Component from "@/components/Chadcn-components/Orders/orders-client";
import { fetchOrderSpecificData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page({ params }) {
  const { specific } = await params;
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchOrderSpecificData(user.userId, specific)
    : { data: null };
  return (
    <Component
      ThemeContext={ThemeContext}
      specific={specific}
      initialData={result.data}
    />
  );
}

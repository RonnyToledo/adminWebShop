import BlogPage from "@/components/Chadcn-components/blog-admin/BlogPage";
import React from "react";
import { fetchBlogData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchBlogData(user.userId)
    : { data: null };
  return <BlogPage initialData={result.data} />;
}

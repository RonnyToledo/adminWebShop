import { CreatePostForm } from "@/components/Chadcn-components/blog-admin/create-post-form";
import { fetchBlogData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function NewBlogPostPage() {
  const user = await getServerUser();
  const result = user?.userId ? await fetchBlogData(user.userId) : null;

  if (result?.error) {
    throw new Error(`No se pudieron cargar los posts del blog: ${result.error.message}`);
  }

  return (
    <CreatePostForm availablePosts={result?.data?.store?.blogs ?? []} />
  );
}

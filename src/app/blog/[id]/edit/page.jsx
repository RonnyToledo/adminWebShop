import { notFound } from "next/navigation";
import { CreatePostForm } from "@/components/Chadcn-components/blog-admin/create-post-form";
import { fetchBlogData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function EditBlogPostPage({ params }) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user?.userId) notFound();

  const result = await fetchBlogData(user.userId);
  if (result.error) {
    throw new Error(`No se pudieron cargar los posts del blog: ${result.error.message}`);
  }

  const posts = result.data?.store?.blogs ?? [];
  const post = posts.find((entry) => String(entry.id) === String(id));
  if (!post) notFound();

  return <CreatePostForm initialPost={post} availablePosts={posts} />;
}

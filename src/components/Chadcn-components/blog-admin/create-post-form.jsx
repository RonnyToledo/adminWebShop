"use client";

import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { PostBasicInfo } from "./post-basic-info";
import { PostContentEditor } from "./post-content-editor";
import { ThemeContext } from "@/context/useContext";
import { toast } from "sonner";

function resolvePostSlug(reference, posts) {
  if (reference == null || reference === "") return "";
  const post = posts.find(
    (entry) =>
      String(entry.slug) === String(reference) ||
      String(entry.id) === String(reference),
  );
  return post?.slug ?? String(reference);
}

export function CreatePostForm({ initialPost = null, availablePosts = [] }) {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const posts = availablePosts.length
    ? availablePosts
    : webshop?.store?.blogs ?? [];
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id: initialPost?.id ?? null,
    title: initialPost?.title ?? "",
    slug: initialPost?.slug ?? "",
    excerpt: initialPost?.abstract ?? "",
    content: initialPost?.description ?? "",
    imageUrl: initialPost?.image ?? "",
    author: "Admin",
    published: initialPost?.published ?? false,
    publishAt: initialPost?.publish_at ?? null,
    former: resolvePostSlug(initialPost?.former, posts),
    next: resolvePostSlug(initialPost?.next, posts),
  });

  const handleBasicInfoComplete = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleContentComplete = async (content) => {
    try {
      const form = new FormData();
      const store = webshop?.store;
      if (!store?.UUID || !store?.sitioweb) {
        throw new Error("No se pudo identificar la tienda activa.");
      }
      form.append("ui_store", store.UUID);
      form.append("slug", formData.slug);
      form.append("title", formData.title);
      form.append("description", content);
      form.append("abstract", formData.excerpt);
      if (formData.imageUrl) {
        form.append("image", formData.imageUrl);
      }
      form.append("remove_image", String(formData.removeImage ?? false));
      form.append("published", String(formData.published));
      form.append("publish_at", formData.publishAt ?? "");
      form.append("former", formData.former ?? "");
      form.append("next", formData.next ?? "");
      if (initialPost) form.append("id", initialPost.id);

      const endpoint = `/api/tienda/${store.sitioweb}/post`;
      const postPromise = fetch(endpoint, {
        method: initialPost ? "PATCH" : "POST",
        body: form,
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || "No se pudo guardar el post.");
        }
        return { data: result };
      });

      await toast.promise(postPromise, {
        loading: initialPost ? "Guardando cambios..." : "Subiendo Post...",
        success: (response) => {
          const savedPost = response.data.data;
          setWebshop((previous) => ({
            ...previous,
            store: {
              ...previous?.store,
              blogs: initialPost
                ? (previous?.store?.blogs ?? []).map((post) =>
                    String(post.id) === String(savedPost.id)
                      ? savedPost
                      : post,
                  )
                : [...(previous?.store?.blogs ?? []), savedPost],
            },
          }));
          router.push("/blog");
          return initialPost
            ? "Post actualizado correctamente"
            : "Post creado correctamente";
        },
        error: (err) => {
          console.error(err);
          return initialPost
            ? "Error al actualizar el post"
            : "Error al crear el post";
        },
      });
    } catch (error) {
      console.error(
        initialPost ? "Error al actualizar post:" : "Error al crear post:",
        error,
      );
      throw error;
    }
  };

  return (
    <div>
      {step === 1 && (
        <PostBasicInfo
          initialData={formData}
          availablePosts={posts}
          onComplete={handleBasicInfoComplete}
        />
      )}
      {step === 2 && (
        <PostContentEditor
          initialContent={formData.content}
          isEditing={Boolean(initialPost)}
          onBack={handleBack}
          onComplete={handleContentComplete}
          slug={formData.slug}
        />
      )}
    </div>
  );
}

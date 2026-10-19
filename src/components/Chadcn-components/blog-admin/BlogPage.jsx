"use client";
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CalendarClock,
  Eye,
  EyeOff,
  Plus,
  LoaderIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeContext } from "@/context/useContext";
import { logoAdmin } from "@/utils/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function BlogPage({ initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const router = useRouter();
  const [loading, setLoading] = useState("");

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);

  async function DeletePost(slug) {
    if (!slug) return;
    setLoading(slug);
    const url = `/api/tienda/${webshop?.store?.sitioweb}/post`;
    const form = new FormData();
    form.append("slug", slug);
    form.append("ui_store", webshop?.store?.UUID ?? "");
    try {
      const postPromise = fetch(url, { method: "DELETE", body: form }).then(
        async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.error || "No se pudo eliminar el post.");
          }
          return response;
        },
      );
      await toast.promise(postPromise, {
        loading: "Eliminando post...",
        success: () => {
          setWebshop((previous) => ({
            ...previous,
            store: {
              ...previous?.store,
              blogs: (previous?.store?.blogs ?? []).filter(
                (post) => post.slug !== slug,
              ),
            },
          }));
          router.refresh();
          return "Post eliminado";
        },
        error: (err) => {
          console.error(err);
          return "Error al eliminar el post";
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading("");
    }
  }

  const posts = webshop?.store?.blogs || [];

  const getPublicationState = (post) => {
    const publishAt = post.publish_at ? new Date(post.publish_at) : null;
    if (
      post.published &&
      publishAt &&
      !Number.isNaN(publishAt.getTime()) &&
      publishAt > new Date()
    ) {
      return {
        label: `Programado ${publishAt.toLocaleDateString("es-ES")}`,
        icon: CalendarClock,
        className: "border-amber-300 text-amber-700",
      };
    }
    if (!post.published) {
      return {
        label: "No publicado",
        icon: EyeOff,
        className: "bg-secondary text-muted-foreground",
      };
    }
    return {
      label: "Publicado",
      icon: Eye,
      className: "border-primary/30 text-primary",
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Contenido
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">Blog</h1>
        </div>
        <Link
          href="/blog/new"
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus size={14} />
          Nuevo post
        </Link>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-background border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors group flex flex-col"
          >
            {/* Imagen */}
            <div className="relative h-44 w-full bg-secondary overflow-hidden">
              <Image
                src={post.image || logoAdmin}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Contenido */}
            <div className="p-4 flex flex-col flex-1 gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                  {post.title}
                </h3>
                {post.abstract && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.abstract}
                  </p>
                )}
                {(() => {
                  const state = getPublicationState(post);
                  const StateIcon = state.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 mt-3 rounded-md border px-2 py-1 text-[11px] ${state.className}`}
                    >
                      <StateIcon size={12} />
                      {state.label}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={11} />
                  <time dateTime={post.created_at}>
                    {new Date(post.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/blog/${post.id}/edit`}
                    aria-label={`Editar ${post.title}`}
                    title="Editar post"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil size={13} />
                  </Link>
                  <button
                    disabled={!!loading}
                    onClick={() => DeletePost(post.slug)}
                    aria-label={`Eliminar ${post.title}`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    {post.slug === loading ? (
                      <LoaderIcon size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty */}
      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <Plus size={22} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Sin posts publicados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer artículo para empezar
            </p>
          </div>
          <Link
            href="/blog/new"
            className="text-xs text-primary hover:underline transition-colors"
          >
            Crear primer post →
          </Link>
        </div>
      )}
    </div>
  );
}

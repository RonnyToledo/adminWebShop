"use client";
import React, { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Plus, LoaderIcon, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import axios from "axios";
import { motion } from "framer-motion";

export default function BlogPage() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [loading, setLoading] = useState("");

  async function DeletePost(slug, image) {
    if (!slug) return;
    setLoading(slug);
    const url = `/api/tienda/${webshop?.store?.sitioweb}/post`;
    const form = new FormData();
    form.append("slug", slug);
    if (image) form.append("image", image);
    try {
      const postPromise = fetch(url, { method: "DELETE", body: form });
      sileo.promise(postPromise, {
        loading: { title: "Eliminando post..." },
        success: () => {
          setWebshop({
            ...webshop,
            store: {
              ...webshop?.store,
              blogs: webshop?.store?.blogs.filter((p) => p.slug !== slug),
            },
          });
          return {
            title: "Post eliminado",
            description: "Información actualizada",
          };
        },
        error: (err) => {
          console.error(err);
          return { title: "Error", description: "Error al eliminar el post" };
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading("");
    }
  }

  const posts = webshop?.store?.blogs || [];

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
                src={post.image || logoApp}
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
                <button
                  disabled={!!loading}
                  onClick={() => DeletePost(post.slug, post.image)}
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

"use client";
import React, { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Plus, LoaderIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";
import axios from "axios";

export default function BlogPage() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [loading, setloading] = useState("");
  // En producción, esto vendría de Supabase
  async function DeletePost(params, image) {
    if (!params) {
      return;
    }
    console.log(params);
    setloading(params);

    const url = `/api/tienda/${webshop?.store?.sitioweb}/post`;

    const form = new FormData();
    form.append("slug", params);
    if (image) form.append("image", image);
    try {
      const postPromise = fetch(url, {
        method: "DELETE",
        body: form, // NO headers Content-Type
      });
      toast.promise(postPromise, {
        loading: "Subiendo Post",
        success: () => {
          // Actualiza el estado con la respuesta (usar updater para seguridad)
          setWebshop({
            ...webshop,
            store: {
              ...webshop?.store,
              blogs: webshop?.store?.blogs.filter((p) => p.slug !== params),
            },
          });
          // Puedes devolver el texto que quieres que muestre el toast en success
          return "Tarea Ejecutada — Información actualizada";
        },
        error: (err) => {
          console.error(err);
          // Puedes devolver un mensaje de error que se mostrará en el toast
          // Logging más detallado se hace en el catch
          return "Error al guardar el post";
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setloading("");
    }
  }
  console.log(loading);
  console.log(webshop?.store?.blogs);
  return (
    <div className="min-h-screen bg-background">
      {/* Posts Grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full overflow-hidden bg-muted">
              <Image
                src={logoApp}
                alt={"Post New"}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>

            <CardHeader>
              <CardTitle className="text-xl text-balance">
                <Link href={`/blog/new`} className="hover:underline">
                  Agregar nuevo post
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1"></CardContent>
            <CardFooter>
              <Button variant="ghost" asChild className="w-full group">
                <Link href={`/blog/new`}>
                  Agregar
                  <Plus className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          {(webshop?.store?.blogs || []).map((post) => (
            <Card
              key={post.id}
              className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                <Image
                  src={post.image || logoApp}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </div>

              <CardHeader>
                <CardTitle className="text-xl text-balance">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.abstract}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.created_at}>
                      {new Date(post.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  disabled={!!loading}
                  className="w-full group"
                  onClick={() => DeletePost(post.slug, post.image)}
                >
                  {post.slug == loading ? (
                    <LoaderIcon className="animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {(webshop?.store?.blogs || []).length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No hay posts publicados todavía.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

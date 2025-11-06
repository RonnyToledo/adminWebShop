"use client";
import React, { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeContext } from "@/context/useContext";
import { logoApp } from "@/utils/image";

export default function BlogPage() {
  const { webshop, setWebshop } = useContext(ThemeContext);
  // En producción, esto vendría de Supabase
  console.log(webshop);
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
              {post.image && (
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <Image
                    src={post.image || logoApp}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-balance">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
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
                <Button variant="ghost" className="w-full group">
                  Delete
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
